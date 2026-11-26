import { useState } from 'react';
import type { ImgHTMLAttributes } from 'react';

type Props=Omit<ImgHTMLAttributes<HTMLImageElement>,'src'> & {
  src:string;
  fallback?:string;
};

/** A published source change gets fresh loading/fallback state. */
export function ScenicImage(props:Props){
  return <ScenicImageSource key={JSON.stringify([props.src,props.fallback])} {...props}/>;
}

function ScenicImageSource({src,fallback,alt='',onLoad,onError,className='',...rest}:Props){
  const [failed,setFailed]=useState(false);
  const [ready,setReady]=useState(false);
  const url=failed&&fallback?fallback:src;
  return <img {...rest} src={url} alt={alt} className={className+' scenic-image '+(ready?'is-ready':'')}
    onLoad={event=>{setReady(true);onLoad?.(event);}}
    onError={event=>{if(!failed&&fallback){setFailed(true);setReady(false);}onError?.(event);}}/>;
}
