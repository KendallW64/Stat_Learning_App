export function validate(values,min=1){if(!Array.isArray(values)||values.length<min||values.some(x=>typeof x!=='number'||!Number.isFinite(x)))throw new Error(`Enter at least ${min} finite numbers.`);return values;}
export const sum=x=>validate(x).reduce((a,b)=>a+b,0);
export const mean=x=>sum(x)/x.length;
export function quantile(x,p){validate(x);if(p<0||p>1)throw new Error('Percentile must be between 0 and 1.');const a=[...x].sort((a,b)=>a-b),i=(a.length-1)*p,l=Math.floor(i);return a[l]+(a[Math.ceil(i)]-a[l])*(i-l);}
export const median=x=>quantile(x,.5);
export function modes(x){validate(x);const counts=new Map;for(const v of x)counts.set(v,(counts.get(v)||0)+1);const max=Math.max(...counts.values());return max===1?[]:[...counts].filter(([,n])=>n===max).map(([v])=>v).sort((a,b)=>a-b);}
export function variance(x,sample=true){validate(x,sample?2:1);const m=mean(x);return x.reduce((s,v)=>s+(v-m)**2,0)/(x.length-(sample?1:0));}
export const sd=(x,sample=true)=>Math.sqrt(variance(x,sample));
export function zscore(value,x){const s=sd(x);if(!s)throw new Error('A z-score needs nonzero standard deviation.');return(value-mean(x))/s;}
// Abramowitz & Stegun 7.1.26; maximum absolute erf error about 1.5e-7.
export function normalCDF(z){const sign=z<0?-1:1,x=Math.abs(z)/Math.SQRT2,t=1/(1+.3275911*x);const erf=1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-.284496736)*t+.254829592)*t*Math.exp(-x*x);return(1+sign*erf)/2;}
export function regression(x,y){validate(x,3);validate(y,3);if(x.length!==y.length)throw new Error('Paired data must have equal lengths.');const a=mean(x),b=mean(y),xx=sum(x.map(v=>(v-a)**2)),yy=sum(y.map(v=>(v-b)**2)),xy=sum(x.map((v,i)=>(v-a)*(y[i]-b)));if(!xx||!yy)throw new Error('Correlation requires variation in both variables.');return{slope:xy/xx,intercept:b-xy/xx*a,r:xy/Math.sqrt(xx*yy)};}
export const round=(v,d=3)=>Number(v.toFixed(d));
export function grade(answer,expected){const n=typeof answer==='number'?answer:typeof answer==='string'&&answer.trim()!==''?Number(answer):NaN;return Number.isFinite(n)&&Math.abs(n-expected)<=.0050001;}
export function describe(x,sample=true){const m=mean(x);return {n:x.length,mean:m,median:median(x),modes:modes(x),range:Math.max(...x)-Math.min(...x),variance:variance(x,sample),sd:sd(x,sample),q1:quantile(x,.25),q3:quantile(x,.75),steps:x.map(v=>({value:v,deviation:v-m,squared:(v-m)**2}))};}
