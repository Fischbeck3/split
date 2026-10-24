import {NFL_TEAMS,NFL_DIVISIONS} from './nfl-themes.js';
import {mountSeasonalGallery} from './seasonal-gallery.js';
const slug = value => value.toLowerCase().replaceAll(' ','-');
mountSeasonalGallery(NFL_DIVISIONS.map(division => ({
  grid:slug(division)+'Grid',places:NFL_TEAMS.filter(team => team.division === division).map(team => ({
    id:team.id,name:team.label,vessel:team.team+' · clear stadium cup'
  }))
})));
const search=document.getElementById('teamSearch');
search.addEventListener('input',()=>{
  const query=search.value.trim().toLocaleLowerCase();let visible=0;
  for(const team of NFL_TEAMS){
    const article=document.getElementById(team.id);
    const match=[team.team,team.name,team.label,team.location,team.division,team.abbr].join(' ').toLocaleLowerCase().includes(query);
    if(article)article.hidden=!match;if(match)visible++;
  }
  for(const division of NFL_DIVISIONS){
    const section=document.getElementById(slug(division));
    section.hidden=![...section.querySelectorAll('article')].some(article=>!article.hidden);
  }
  document.getElementById('noTeams').hidden=visible>0;
  document.getElementById('teamCount').textContent=visible+' team '+(visible===1?'cup':'cups');
});
