"use strict";
// Presentation-only sample states. No Core transport, network, timers or authority.
(()=>{
 const $=id=>document.getElementById(id);
 let current='ready',mode='auto',tab='permission';
 let action=0,walkthrough=false;
 const tools=String.raw`C:\CyllarisDemo\tools`;
 // Fictional public sample commands. Never passed to a transport or executed.
 let commands=['inspect','apply','verify'].map(a=>`"${tools}\\python.exe" -I -S -B "${tools}\\project_fixture.py" ${a}`);
 let results=[['Project inspected successfully','service.port is a string. No files changed.'],['Correction saved','service.port is now integer 8080. Verification is still pending.'],['Configuration verified','Saved service.port is integer 8080. App launch was not tested.']];
 const events=[];
 const nextLabels={working:'Simulate completed action',queued:'Simulate clearing the chat input',countdown:'Simulate delay elapsed, Send and ACK',manual:'Simulate provider Send and ACK',pausing:'Simulate Pause confirmation',stopping:'Simulate Stop confirmation'};
 const states={
  unavailable:{core:'CORE STATUS UNAVAILABLE',title:'Check state.',description:'Connection lost. Execution or delivery may be unresolved. No automatic reconnect, re-arm or retry.',primary:'Details',tone:'attention',activity:[['Connection lost','Inspect persisted ownership and outcomes before continuing.']]},
  disconnected:{core:'PAUSED / NO CLIENT',title:'Connect.',description:'Connect a supported client to see its conversation and task permission.',primary:'Connect',activity:[['No client connected','No task can begin.']]},
  ready:{core:'PAUSED / READY',title:'Ready.',description:'Arm this task to allow its permitted actions and result delivery.',primary:'Arm',activity:[['Client connected','Task is ready for your permission.']]},
  working:{core:'ARMED / INSPECTING',title:'Working.',description:'Inspecting the setting in your disposable project copy.',primary:'Pause',activity:[['Inspection started','First permitted action · no changes yet.']]},
  queued:{core:'CORE ARMED',title:'1 result waiting.',description:'You’re writing in the chat. Your draft stays untouched. Clear the input to begin a fresh send delay.',primary:'Pause',tone:'attention',outcome:['Project inspected successfully','service.port is a string. No files changed.'],activity:[['Inspection completed','Execution succeeded; result is saved.'],['Delivery waiting','The chat input belongs to you.']]},
  countdown:{core:'CORE ARMED',title:'Send delay.',description:'The input is clear. Typing again will cancel this countdown and keep your result.',primary:'Pause',outcome:['Project inspected successfully','Result is staged for this conversation.'],activity:[['Input cleared','A new composer claim starts the full send delay.'],['Auto delivery prepared','Waiting for the remaining sample countdown.']]},
  manual:{core:'CORE ARMED',title:'Ready in your chat.',description:'Review the prepared result in the chat input, then use the chat’s Send button.',primary:'Pause',outcome:['Project inspected successfully','Result is staged. It has not been sent or acknowledged.'],activity:[['Inspection completed','Execution succeeded; result is saved.'],['Manual delivery prepared','Waiting for you to Send in the chat.']]},
  paused:{core:'PAUSE CONFIRMED',title:'Paused.',description:'New actions and automatic delivery are paused. Check the retained result before starting another run.',primary:'View result',tone:'attention',outcome:['Project inspected successfully','Delivery has not completed. No retry was sent.'],activity:[['Inspection completed','Execution succeeded; result is saved.'],['Task paused','No new actions or automatic deliveries.']]},
  pausing:{core:'PAUSE REQUESTED · CONFIRMATION PENDING',title:'Pause requested.',description:'The request was sent. The current action may still be running. Stop remains available.',primary:'Pause pending',tone:'attention',activity:[['Pause requested','No new task progression; awaiting authoritative state.']]},
  complete:{core:'CORE ARMED · TASK LIMIT REACHED',title:'Task complete.',description:'The setting is corrected and verified. All three results were acknowledged. No actions remain in this task.',primary:'Pause',outcome:['service.port is now integer 8080','Exactly one inspection, one correction and one verification.'],activity:[['Setting corrected','The approved change was saved.'],['Verification completed','Final result acknowledged; task limit reached.']]},
  unknown:{core:'CORE STATUS UNAVAILABLE',title:'Check delivery.',description:'The command succeeded, but the AI’s receipt is unconfirmed. This result will not be sent again automatically.',primary:'View result',tone:'attention',outcome:['Project inspected successfully','Execution: succeeded · delivery: unconfirmed'],activity:[['Inspection completed','Execution succeeded; result is saved.'],['Connection interrupted','Reconcile this delivery before continuing.']]},
  stopped:{core:'CORE STOPPED',title:'Stop confirmed.',description:'New execution is blocked and owned work was terminated. Inspect the saved state before any explicit reset.',primary:'Details',tone:'attention',activity:[['Stop confirmed','No automatic reset, restart or retry.']]},
  stopping:{core:'STOP REQUESTED · CONFIRMATION PENDING',title:'Stop requested.',description:'Stop was requested through the independent path. Termination is not yet confirmed. No reset or restart is permitted.',primary:'Stop pending',tone:'attention',activity:[['Stop requested','Waiting for authoritative ownership and termination confirmation.']]}
 };
 const armed=()=>['working','queued','countdown','manual','complete'].includes(current);
 function activityRows(){
  const rows=walkthrough&&events.length?events:states[current].activity;
  $('detail-history').replaceChildren(...rows.map(([title,description])=>{const li=document.createElement('li');li.textContent=title+'  |  '+description;return li;}));
 }
 function render(){
  document.querySelector('.app').dataset.state=current;
  const s=states[current];$('scenario').value=current;
  const core=walkthrough&&current==='working'?`ARMED / ${['INSPECTING','APPLYING','VERIFYING'][action]}`:s.core;
  const sampledResult=walkthrough&&s.outcome&&current!=='complete';
  $('command-label').textContent=current==='complete'?'Last command · sample':'Proposed command · sample';
  $('command-text').textContent=current==='disconnected'?'No proposed command.':commands[action];
  $('command-stage').textContent=current==='disconnected'?'Connect to begin the sample.':`Action ${action+1} of 3 · ${['Inspect','Apply','Verify'][action]} · ${core}`;
  $('sample-next').disabled=!nextLabels[current];
  $('sample-next').textContent=nextLabels[current]??(current==='ready'?'Arm to start the walkthrough':'No further sample event');
  $('walkthrough-help').textContent=['unknown','unavailable'].includes(current)?'Unresolved sample outcome. There is no automatic continuation or retry. Restart sample only resets this illustration.':'No commands run. Advance each sample event here; the slider sets the illustrated delay, not a running timer.';
  $('connection-label').textContent=current==='disconnected'?'No client':current==='unavailable'||current==='unknown'?'Unavailable':'Connected';
  $('connection-dot').style.opacity=['disconnected','unavailable','unknown'].includes(current)?'.25':'1';
  $('connect').textContent=current==='disconnected'?'Connect':['unknown','unavailable'].includes(current)?'Unavailable':'Disconnect';
  $('connect').disabled=['unknown','unavailable','pausing','stopping','stopped'].includes(current);
  $('core-label').textContent=core;$('status-title').textContent=s.title;$('status-description').textContent=walkthrough&&current==='working'?['Inspecting the selected sample inputs.','Producing the exact permitted sample output.','Checking the saved sample output.'][action]:s.description;
  $('status-card').dataset.tone=s.tone??'normal';$('diagnostic-state').textContent=core+'  |  '+$('status-description').textContent;
  $('primary-text').textContent=s.primary;$('primary-symbol').className=armed()?'play pause':['pausing','stopping','unknown','unavailable','stopped','paused'].includes(current)?'play pending':'play';
  // The real independent Stop path must remain reachable in every screen state.
  $('stop').disabled=false;
  $('outcome').hidden=!s.outcome||(walkthrough&&current!=='complete'&&!events.some(([title])=>title===results[action][0]));
  if(s.outcome){$('outcome-title').textContent=sampledResult?results[action][0]:(current==='complete'?results[2][0]:results[action][0]);$('outcome-description').textContent=sampledResult?results[action][1]+' '+(current==='manual'?'It has not been sent or acknowledged.':current==='unknown'?'Delivery is unconfirmed.':'Delivery is pending.'):(current==='complete'?results[2][1]:results[action][1]);}
  const editable=['ready','disconnected','paused'].includes(current);
  $('permission-profile').disabled=!editable;
  $('manual-mode').disabled=!editable;$('auto-mode').disabled=!editable;
  $('manual-mode').setAttribute('aria-pressed',String(mode==='manual'));$('auto-mode').setAttribute('aria-pressed',String(mode==='auto'));
  $('delay').disabled=!editable||mode==='manual';
  $('mode-help').textContent=mode==='auto'?'Auto sends an eligible result after your chosen delay.':'Manual prepares the result in your chat. You use the chat’s Send button.';
  $('footer-note').textContent=['unknown','unavailable'].includes(current)?'Saved outcomes remain available. Reconnecting cannot authorize a retry.':'Only the displayed task is permitted. Pause keeps saved results.';
  validate();activityRows();window.cyllarisApplyEvidence?.();
 }
 function validate(){
  const value=$('delay').valueAsNumber,valid=Number.isFinite(value)&&value>=0&&value<=60&&Number.isInteger(value*2);
  $('delay-value').textContent=Number.isFinite(value)?value.toFixed(1)+' s':' | ';
  $('delay').setAttribute('aria-valuetext',Number.isFinite(value)?value.toFixed(1)+' seconds':'Invalid delay');
  $('delay-error').hidden=valid||mode==='manual';$('delay').setAttribute('aria-invalid',String(!valid&&mode==='auto'));
  $('primary').disabled=['pausing','stopping'].includes(current)||(current==='ready'&&mode==='auto'&&!valid);
 }
 function openDetails(section='permission',moveFocus=true){
  tab=section;$('details-panel').hidden=false;$('details-open').setAttribute('aria-expanded','true');
  document.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tab===tab)));
  ['permission','history','appearance','diagnostics'].forEach(n=>$(n+'-content').hidden=n!==tab);
  if(moveFocus)$('details-close').focus();
 }
 function closeDetails(){$('details-panel').hidden=true;$('details-open').setAttribute('aria-expanded','false');$('details-open').focus();}
 $('scenario').addEventListener('change',()=>{current=$('scenario').value;walkthrough=false;events.length=0;action=current==='complete'?2:0;if(current==='manual')mode='manual';else if(['queued','countdown','working','complete'].includes(current))mode='auto';render();});
 $('manual-mode').addEventListener('click',()=>{mode='manual';render();});$('auto-mode').addEventListener('click',()=>{mode='auto';render();});
 $('delay').addEventListener('input',validate);
 $('connect').addEventListener('click',()=>{current=current==='disconnected'?'ready':armed()?'unavailable':'disconnected';render();});
 $('primary').addEventListener('click',()=>{if(current==='disconnected')current='ready';else if(current==='ready'){current='working';walkthrough=true;events.length=0;events.push(['Sample task armed','Inspection started. No real command runs.']);}else if(armed()){current='pausing';if(walkthrough)events.push(['Pause requested','Confirmation is pending.']);}else{openDetails('history');return;}render();});
 $('stop').addEventListener('click',()=>{current='stopping';if(walkthrough)events.push(['Stop requested','Termination confirmation is pending.']);render();});
 $('details-open').addEventListener('click',()=>openDetails());$('details-close').addEventListener('click',closeDetails);
 document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>openDetails(b.dataset.tab,false)));
 $('sample-restart').addEventListener('click',()=>{current='ready';action=0;walkthrough=false;events.length=0;render();});
 $('sample-next').addEventListener('click',()=>{
  if(!nextLabels[current])return;
  walkthrough=true;
  if(current==='working'){events.push([results[action][0],results[action][1]]);current=mode==='manual'?'manual':'queued';}
  else if(current==='queued'){current='countdown';events.push(['Sample chat input cleared',`Full ${$('delay').valueAsNumber.toFixed(1)}-second delay starts. No real timer runs.`]);}
  else if(current==='countdown'||current==='manual'){
   events.push(['Sample provider Send observed',`Action ${action+1}: receipt is not yet acknowledgment.`],['Sample Core ACK accepted',`Action ${action+1}: durable acknowledgment simulated.`]);
   if(action===2)current='complete';else{action++;current='working';events.push(['Next permitted sample proposal',commands[action]]);}
  }else if(current==='pausing'){current='paused';events.push(['Sample Pause confirmed','New actions and automatic delivery are paused.']);}
  else if(current==='stopping'){current='stopped';events.push(['Sample Stop confirmed','Owned work termination is simulated. No reset or restart.']);}
  render();
 });
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('details-panel').hidden)closeDetails();});
 document.addEventListener('cyllaris:sample-phase',e=>{action=e.detail.action;walkthrough=current==='working';render();});
 document.addEventListener('cyllaris:sample-task',e=>{
  const task=e.detail;
  commands=['inspect','apply','verify'].map(a=>`"${tools}\\python.exe" -I -S -B "${tools}\\${task.command}" ${a}`);
  results=task.results;
  states.complete.activity=[task.results[1],task.results[2]];
  states.queued.activity=[task.results[0],['Delivery waiting','The chat input belongs to you.']];
  document.querySelector('.task-title').textContent=task.task;
  document.querySelector('.scope').textContent=task.scope+' / bounded sample';
  const sampleHeading=Array.from(document.querySelectorAll('#permission-content h3')).find(h=>h.textContent==='Sample task');
  if(sampleHeading)sampleHeading.nextElementSibling.textContent=task.permission;
  states.working.description='Running a permitted sample action in the selected task.';
  states.complete.description='The sample outputs were checked and all three result acknowledgments illustrated. No actions remain in this sample.';
  states.complete.outcome=[task.results[2][0],task.results[2][1]];
  for(const key of ['queued','countdown','manual','paused','unknown'])states[key].outcome=task.results[0];
  render();
 });
 // Themes are declarative appearance data only. No CSS/HTML/code is imported.
 const paletteKeys=['background','surface','raised','line','text','muted','teal','pink'];
 const themes={
  precision:{schema:1,name:'Precision',radius:18,colors:{background:'#080d12',surface:'#101820',raised:'#1a2834',line:'#586f82',text:'#e8f0f7',muted:'#b1c2d1',teal:'#b5deff',pink:'#ffb8be'}},
  foundry:{schema:1,name:'Foundry',radius:18,colors:{background:'#0b0e11',surface:'#14191e',raised:'#1b2229',line:'#2b343d',text:'#eff3f6',muted:'#a7b3be',teal:'#00f5d4',pink:'#ff3cac'}},
  midnight:{schema:1,name:'Midnight',radius:18,colors:{background:'#080d1c',surface:'#121b2c',raised:'#1c2940',line:'#34445a',text:'#edf4ff',muted:'#b2bfd3',teal:'#8ce5ef',pink:'#ff93d0'}},

 };
 let applied=themes.precision;
 function luminance(hex){const c=[1,3,5].map(n=>parseInt(hex.slice(n,n+2),16)/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722;}
 function contrast(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
 function checkedTheme(value){
  if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).sort().join(',')!=='colors,name,radius,schema'||value.schema!==1||typeof value.name!=='string'||!value.name.trim()||value.name.length>40||/[\x00-\x1f]/.test(value.name)||!Number.isInteger(value.radius)||value.radius<8||value.radius>24)throw Error('Use a valid Cyllaris theme file.');
  if(!value.colors||Object.keys(value.colors).sort().join(',')!==paletteKeys.slice().sort().join(',')||!paletteKeys.every(k=>/^#[0-9a-f]{6}$/i.test(value.colors[k])))throw Error('Themes accept eight hex colors only; no scripts or extra fields.');
  for(const surface of ['background','surface','raised'])for(const fg of ['text','muted'])if(contrast(value.colors[fg],value.colors[surface])<4.5)throw Error('Increase text contrast so the theme stays readable.');
  if(contrast(value.colors.teal,value.colors.surface)<4.5||contrast(value.colors.pink,value.colors.surface)<4.5)throw Error('Keep primary actions and Stop readable.');
  return JSON.parse(JSON.stringify(value));
 }
 function themeMessage(text,error=false){$('theme-message').textContent=text;$('theme-message').dataset.error=String(error);}
 function applyTheme(value){
  const t=checkedTheme(value);paletteKeys.forEach(k=>document.documentElement.style.setProperty('--'+k,t.colors[k]));
  document.documentElement.style.setProperty('--radius',t.radius+'px');
  document.documentElement.style.colorScheme=luminance(t.colors.surface)>.5?'light':'dark';
  document.querySelector('.app').style.setProperty('--action-text',contrast('#062722',t.colors.teal)>=4.5?'#062722':'#ffffff');
  applied=t;themeMessage(t.name+' theme applied.');
 }
 const labels={background:'Backdrop',surface:'Widget',raised:'Inset surfaces',line:'Dividers',text:'Text',muted:'Secondary text',teal:'Instrument accent',pink:'Stop accent'};
 paletteKeys.forEach(k=>{const label=document.createElement('label'),input=document.createElement('input');label.textContent=labels[k];input.type='color';input.id='theme-color-'+k;input.setAttribute('aria-label',labels[k]);label.append(input);$('theme-colors').append(label);});
 function showTheme(t){$('theme-name').value=t.name;$('theme-radius').value=String(t.radius);$('theme-radius-value').textContent=t.radius+' px';paletteKeys.forEach(k=>$('theme-color-'+k).value=t.colors[k]);}
 function editedTheme(){return {schema:1,name:$('theme-name').value.trim(),radius:Number($('theme-radius').value),colors:Object.fromEntries(paletteKeys.map(k=>[k,$('theme-color-'+k).value]))};}
 $('theme-radius').addEventListener('input',()=>$('theme-radius-value').textContent=$('theme-radius').value+' px');
 $('theme-preset').addEventListener('change',()=>{const t=themes[$('theme-preset').value];showTheme(t);applyTheme(t);});
 $('theme-apply').addEventListener('click',()=>{try{applyTheme(editedTheme());}catch(e){themeMessage(e.message,true);}});
 $('theme-export').addEventListener('click',()=>{
  try{const t=checkedTheme(editedTheme()),blob=new Blob([JSON.stringify(t,null,2)+'\n'],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=(t.name.replace(/[^a-z0-9_-]+/gi,'-').replace(/^-+|-+$/g,'')||'cyllaris')+'.cyllaris-theme.json';a.click();URL.revokeObjectURL(url);themeMessage('Theme exported. Share this file to share its appearance.');}catch(e){themeMessage(e.message,true);}
 });
 $('theme-import').addEventListener('change',async()=>{
  const file=$('theme-import').files[0];if(!file)return;
  try{if(file.size>8192)throw Error('Theme files must be smaller than 8 KiB.');const t=checkedTheme(JSON.parse(await file.text()));showTheme(t);applyTheme(t);}catch(e){themeMessage(e.message||'Theme import failed.',true);}finally{$('theme-import').value='';}
 });
 showTheme(applied);applyTheme(applied);
 render();
})();



