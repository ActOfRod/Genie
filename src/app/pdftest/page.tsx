"use client";
import { useState } from "react";
export default function P(){const [o,setO]=useState("idle");return <div><input type="file" id="f" onChange={async e=>{try{const {extractPdfLines}=await import("@/lib/parsers/pdf-text");const l=await extractPdfLines(await e.target.files![0].arrayBuffer());setO("OK "+JSON.stringify(l));}catch(err){setO("ERR "+String(err))}}}/><pre id="o">{o}</pre></div>}
