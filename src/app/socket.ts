import {io} from 'socket.io-client';

const URL = process.env.NEXT_PUBLIC_DOMAIN ? process.env.NEXT_PUBLIC_DOMAIN : "http://localhost:3000";

console.log('alteast the file is called')

export default function socket() {
  const socket = io()  

  console.log('connecting!!!');
  
  
  socket.on("connect",()=>{
    console.log('connected to sockeT');
  })
  return socket;
}

