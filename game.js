(()=>{
'use strict';
const {roots,banks}=window.ROOT_GAME;
const titles=['Разминка','Объясни выбор','Ловушки','Мини-проверка'];
const subtitles=['Буква в слове','Найди верное объяснение','Смысл и исключения','Без подсказок'];
const KEY='ao-all-roots-11-v1';
const fresh=()=>({i:0,answers:[],done:false});
let states=banks.map(fresh),mode=0,practice=null;
function valid(s,list){return s&&Number.isInteger(s.i)&&s.i>=0&&s.i<list.length&&typeof s.done==='boolean'&&Array.isArray(s.answers)&&s.answers.length>=(s.done?list.length:s.i)&&s.answers.length<=(s.done?list.length:s.i+1)&&s.answers.every((v,i)=>Number.isInteger(v)&&v>=0&&v<list[i].options.length)&&(!s.done||s.i===list.length-1);}
try{const data=JSON.parse(localStorage.getItem(KEY));if(data&&Array.isArray(data.states)&&data.states.length===4&&data.states.every((s,i)=>valid(s,banks[i]))&&Number.isInteger(data.mode)&&data.mode>=0&&data.mode<4){states=data.states;mode=data.mode;}}catch{}
const game=document.getElementById('game');
const escape=s=>String(s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
function save(){try{localStorage.setItem(KEY,JSON.stringify({mode,states}));}catch{document.getElementById('status').textContent='Браузер не разрешает сохранение: прогресс доступен, пока страница открыта.';}}
function score(s,list){return s.answers.reduce((n,a,i)=>n+(a===list[i].answer?1:0),0);}
function errors(s,list){return list.filter((q,i)=>s.answers[i]!==q.answer);}
function goFocus(){const h=game.querySelector('h2');if(h){h.tabIndex=-1;h.focus({preventScroll:true});}}
document.getElementById('rules').innerHTML=roots.map(r=>`<article class="rule"><h3>${escape(r.name)}</h3><p>${escape(r.rule)}</p><p class="note">${escape(r.note)}</p></article>`).join('');
function render(){
 const list=practice?practice.list:banks[mode],s=practice?practice.state:states[mode],exam=mode===3&&!practice;
 document.getElementById('modes').innerHTML=titles.map((t,i)=>`<button type="button" data-mode="${i}" aria-pressed="${i===mode}"><b>${escape(t)}</b><small>${states[i].done?score(states[i],banks[i])+' / '+banks[i].length+' · завершено':(i<3?'Уровень '+(i+1)+' · ':'')+banks[i].length+' вопросов'}</small></button>`).join('');
 document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=Number(b.dataset.mode);practice=null;save();render();goFocus();});
 document.getElementById('guide').hidden=exam&&!s.done;
 if(exam&&!s.done)document.getElementById('guide').open=false;
 if(s.done){
  const n=score(s,list),misses=errors(s,list),badRoots=new Set(misses.map(q=>q.root));
  game.innerHTML=`<span class="tag">${practice?'Повторение ошибок завершено':escape(titles[mode])+' · результат'}</span><h2>${n===list.length?'Все ответы верные!':n>=list.length*.7?'Хорошая работа!':'Продолжим разбираться'}</h2><div class="result">${n} / ${list.length}</div><p>${Math.round(n/list.length*100)}% верных ответов. ${misses.length?'Розовым отмечены группы, которые стоит повторить.':'В этом раунде ошибок нет.'}</p><div class="root-tags">${[...new Set(list.map(q=>q.root))].map(r=>`<span class="${badRoots.has(r)?'needs':''}">${badRoots.has(r)?'Повторить: ':'✓ '}${escape(roots[r].name)}</span>`).join('')}</div><div class="actions">${misses.length?'<button class="primary" id="mistakes">Разобрать ошибки</button>':''}${practice?'<button class="secondary" id="return">К исходному результату</button>':(mode<3?'<button class="primary" id="continue">'+(mode===2?'Перейти к проверке':'Следующий уровень')+'</button>':'')+'<button class="secondary" id="retry">Пройти заново</button>'}</div><details><summary>Разбор всех ответов</summary>${list.map((q,i)=>`<div class="review"><strong class="${s.answers[i]===q.answer?'good':'bad'}">${s.answers[i]===q.answer?'✓ Верно':'✕ Ошибка'} · ${escape(q.text)}</strong><p>Твой ответ: ${escape(q.options[s.answers[i]])}. Верный ответ: ${escape(q.options[q.answer])}.</p><p>${escape(q.why)}</p></div>`).join('')}</details>`;
  const on=(id,fn)=>{const b=document.getElementById(id);if(b)b.onclick=fn;};
  on('retry',()=>{states[mode]=fresh();save();render();goFocus();});
  on('continue',()=>{mode++;save();render();goFocus();});
  on('mistakes',()=>{practice={list:misses,state:fresh()};render();goFocus();});
  on('return',()=>{practice=null;render();goFocus();});
  return;
 }
 const q=list[s.i],chosen=s.answers[s.i],answered=chosen!==undefined,letters=q.options.every(x=>['А','О','Ы'].includes(x));
 game.innerHTML=`<div class="meta"><span>${practice?'Работа над ошибками':escape(titles[mode])} · ${s.i+1} из ${list.length}</span><span>${exam?'Баллы и разбор в конце':'Верных ответов: '+score(s,list)}</span></div><div class="track" role="progressbar" aria-label="Ответов дано" aria-valuemin="0" aria-valuemax="${list.length}" aria-valuenow="${s.answers.length}"><div class="bar" style="width:${100*s.answers.length/list.length}%"></div></div><p class="prompt">${escape(q.prompt)}</p><h2 class="word">${escape(q.text)}</h2><div class="options ${letters?'letters':''} ${q.options.length===2?'two':''}">${q.options.map((o,i)=>{const cls=!answered?'':exam?(chosen===i?'selected':''):i===q.answer?'correct':i===chosen?'wrong':'';const mark=answered&&!exam?(i===q.answer?'✓':i===chosen?'✕':''):answered&&exam&&i===chosen?'✓':'';return `<button type="button" class="option ${cls}" data-answer="${i}" ${answered?'disabled':''}>${escape(o)}${mark?'<span class="mark" aria-hidden="true">'+mark+'</span>':''}</button>`;}).join('')}</div><div aria-live="polite">${answered?`<div class="feedback">${exam?'Ответ принят. Проверим после завершения.':'<strong>'+(chosen===q.answer?'Верно!':'Верный ответ: '+escape(q.options[q.answer]))+'</strong><p>'+escape(q.why)+'</p>'}</div><div class="actions"><button class="primary" id="next">${s.i===list.length-1?'Посмотреть результат':'Дальше'}</button>${practice?'<button class="secondary" id="return">К исходному результату</button>':''}</div>`:''}</div>`;
 game.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{if(s.answers[s.i]!==undefined)return;s.answers.push(Number(b.dataset.answer));save();render();document.getElementById('next').focus({preventScroll:true});});
 const next=document.getElementById('next');if(next)next.onclick=()=>{if(s.i===list.length-1)s.done=true;else s.i++;save();render();goFocus();};
 const back=document.getElementById('return');if(back)back.onclick=()=>{practice=null;render();goFocus();};
}
render();
})();
