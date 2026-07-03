let QUESTIONS = [];
let state = {};

fetch("data/questions.json")
  .then(r => r.json())
  .then(data => {
    QUESTIONS = data;
    menu();
  })
  .catch(() => {
    document.getElementById("root").innerHTML = "<div class='result'><h2>Erreur</h2><p>Impossible de charger data/questions.json</p></div>";
  });

function shuffle(a){
  a=[...a];
  for(let i=a.length-1;i>0;i--){
    let j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

function same(a,b){
  a=[...a].sort((x,y)=>x-y);
  b=[...b].sort((x,y)=>x-y);
  return a.length===b.length && a.every((v,i)=>v===b[i]);
}

function letters(a){
  return a.map(i=>String.fromCharCode(65+i)).join(", ");
}

function esc(s){
  return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
}

function prepare(q){
  let ops=q.options.map((text,i)=>({text,original:i}));
  return {...q,mixedOptions:shuffle(ops)};
}

function menu(){
  root.innerHTML = `<div class="menu">
    <h2>🎮 Bienvenue dans ImmunoQuest</h2>
    <p>Réponds aux QCM pour gagner de l’XP. Tu as 3 vies.</p>
    <button class="main" onclick="start()">Commencer</button>
  </div>`;
}

function start(){
  state = {deck:shuffle(QUESTIONS).map(prepare),i:0,score:0,lives:3,corrected:false,missed:[]};
  render();
}

function hud(){
  return `<div class="hud">
    <div class="box">❤️ Vies<br><b>${state.lives}</b></div>
    <div class="box">⭐ Score<br><b>${state.score}</b></div>
    <div class="box">📚 QCM<br><b>${Math.min(state.i+1,state.deck.length)}/${state.deck.length}</b></div>
    <div class="box">❌ Erreurs<br><b>${state.missed.length}</b></div>
  </div>`;
}

function render(){
  if(state.lives <= 0) return finish("💀 Game Over");
  if(state.i >= state.deck.length) return finish("🏆 Victoire !");
  let q = state.deck[state.i];
  let opts = "";
  q.mixedOptions.forEach((op,idx)=>{
    opts += `<label class="option"><input type="checkbox" value="${op.original}"> <b>${String.fromCharCode(65+idx)}.</b> ${esc(op.text)}</label>`;
  });
  root.innerHTML = hud() + `<div class="qcard">
    <span class="badge">${esc(q.course)}</span>
    <div class="qtitle">${esc(q.q)}</div>
    <div id="opts">${opts}</div>
    <button id="mainBtn" class="main" onclick="action()">Corriger</button>
    <div id="fb" class="feedback"></div>
    <small>Clavier : 1=A, 2=B, 3=C, 4=D, Entrée=Corriger/Suivant</small>
  </div>`;
  state.corrected = false;
}

function action(){
  state.corrected ? next() : correct();
}

function correct(){
  let q = state.deck[state.i];
  let inputs = [...document.querySelectorAll("#opts input")];
  let selected = inputs.filter(i=>i.checked).map(i=>Number(i.value));
  let ok = same(selected, q.correct);
  inputs.forEach(inp=>{
    let val = Number(inp.value), lab = inp.closest(".option");
    inp.disabled = true;
    if(q.correct.includes(val)) lab.classList.add("good");
    else if(selected.includes(val)) lab.classList.add("bad");
  });
  if(ok){
    state.score += 100;
    fb.innerHTML = `✅ <b>Bonne réponse !</b><br><b>Explication :</b> ${esc(q.exp)}`;
  }else{
    state.lives--;
    state.missed.push(q);
    fb.innerHTML = `❌ <b>Mauvaise réponse.</b><br><b>Réponses :</b> ${letters(q.correct)}<br><b>Explication :</b> ${esc(q.exp)}`;
  }
  fb.style.display = "block";
  mainBtn.textContent = state.i === state.deck.length-1 ? "Terminer" : "Suivant";
  state.corrected = true;
}

function next(){
  state.i++;
  render();
}

function finish(title){
  root.innerHTML = `<div class="result">
    <h2>${title}</h2>
    <p>Score final : <b>${state.score}</b></p>
    <p>Questions ratées : <b>${state.missed.length}</b></p>
    <button class="green" onclick="start()">Rejouer</button>
    <button class="blue" onclick="menu()">Menu</button>
  </div>`;
}

document.addEventListener("keydown",e=>{
  if(["1","2","3","4"].includes(e.key) && !state.corrected){
    let inp = [...document.querySelectorAll("#opts input:not(:disabled)")][Number(e.key)-1];
    if(inp) inp.checked = !inp.checked;
  }
  if(e.key === "Enter" && document.getElementById("mainBtn")){
    e.preventDefault();
    action();
  }
});
