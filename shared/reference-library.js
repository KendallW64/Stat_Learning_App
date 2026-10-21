import {identify,lessons} from './lessons.js';
const handbook='https://www.itl.nist.gov/div898/handbook/';
const references={
 center:['Measures of location',handbook+'eda/section3/eda351.htm'],
 spread:['Measures of scale',handbook+'eda/section3/eda356.htm'],
 quartiles:['Quantile conventions','https://stat.ethz.ch/R-manual/R-devel/library/stats/html/quantile.html','R statistics documentation'],
 probability:['Probability distributions',handbook+'eda/section3/eda36.htm'],
 normal:['Normal distribution',handbook+'eda/section3/eda3661.htm'],
 zscore:['Normal distribution and standardization',handbook+'eda/section3/eda3661.htm'],
 sampling:['Sampling and estimation',handbook+'prc/section2/prc2.htm'],
 confidence:['Confidence intervals',handbook+'prc/section2/prc2.htm'],
 hypothesis:['Hypothesis tests',handbook+'prc/section1/prc1.htm'],
 regression:['Linear least squares regression',handbook+'pmd/section1/pmd141.htm'],
 significance:['Statistical hypotheses',handbook+'prc/section1/prc1.htm'],
 prediction:['Modeling and prediction',handbook+'pmd/pmd.htm'],
};
export function referenceFallback(question,reason){
 if(/course|university|college|syllabus|catalog/i.test(question)&&!identify(question).length)return{ai:false,mode:'Course research unavailable · confirmation required',text:'The model could not verify this course against an official public source. Upload the current syllabus or manually confirm the topics. A school or course number alone is not evidence of its requirements.',sources:[],reason};
 const ids=identify(question),selected=lessons.filter(l=>(ids.length?ids:['spread']).includes(l.id)).slice(0,3);
 return{ai:false,mode:'Curated statistical references · not live Gemini research',text:'Gemini web research is unavailable. The following explanations come from the app’s reviewed lessons, with established statistical references. These pages were not freshly searched or retrieved for this answer.\n\n'+selected.map(l=>`### ${l.title}\n${l.intro}\n\n${l.why}\n\nFormula: ${l.formula}`).join('\n\n'),sources:selected.map(l=>({title:(references[l.id][2]||'NIST e-Handbook')+' · '+references[l.id][0],url:references[l.id][1]})),reason};
}
