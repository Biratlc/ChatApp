import React, { useEffect } from 'react';
import useLocalStorage from 'react-use-localstorage';
import useSocket from 'use-socket.io-client';
import { useImmer } from 'use-immer';
import { useOnlineStatus, useWindowSize } from '@withvoid/melting-pot';
import useClippy from 'use-clippy';
import {FormControl,FormGroup, FormLabel} from '@material-ui/core';
import './index.css';

const Messages = props => {
    const [ clipboard, setClipboard ] = useClippy();

    return props.data.map(m => m[0] !== '' ?
        (<li><strong>{m[0]}</strong> :<a onClick={()=>{setClipboard(`${m[1]}`)}} href="#"><i style={{float:'right',color:'black'}} class="material-icons">✅</i></a> <div className="innermsg">{m[1]}</div></li>)
        : (<li className="update">{m[1]}</li>) );
}

const Online = props => props.data.map(m => <li id={m[0]}>{m[1]}</li>)

export default () => {
    const [room, setRoom] = useLocalStorage('room','');
    const [id, setId] = useLocalStorage('id', '');

    const [socket] = useSocket('https://open-chat-naostsaecf.now.sh');

    const [messages, setMessages] = useImmer([]);

    const [onlineList, setOnline] = useImmer([]);

    const { online } = useOnlineStatus();
    const { width } = useWindowSize();

    useEffect(()=>{
        socket.connect();

        if(id){
            socket.emit('join',id,room);
        }

        socket.on('message que',(nick,message) => {
            setMessages(draft => {
                draft.push([nick,message])
            })
        });

        socket.on('update',message => setMessages(draft => {
            draft.push(['',message]);
        }))

        socket.on('people-list',people => {
            let newState = [];
            for(let person in people){
                newState.push([people[person].id,people[person].nick]);
            }
            setOnline(draft=>{draft.push(...newState)});
        });

        socket.on('add-person',(nick,id)=>{
            setOnline(draft => {
                draft.push([id,nick])
            })
        })

        socket.on('remove-person',id=>{
            setOnline(draft => draft.filter(m => m[0] !== id))
        })

        socket.on('chat message',(nick,message)=>{
            setMessages(draft => {draft.push([nick,message])})
        })
    },0);

    const handleSubmit = e => {
        e.preventDefault();
        const name = document.querySelector('#name').value.trim();
        const room_value = document.querySelector('#room').value.trim();
        console.log(name);
        if (!name) {
            return alert("Name can't be empty");
        }
        setId(name);
        setRoom(room_value);
        socket.emit("join", name,room_value);
    };

    const handleSend = e => {
        e.preventDefault();
        const input = document.querySelector('#m');
        if(input.value.trim() !== ''){
            socket.emit('chat message',input.value,room);
            input.value = '';
        }
    }

    const logOut = () => {
        socket.disconnect();
        setOnline(draft=>[]);
        setMessages(draft=>[]);
        setId('');
        socket.connect();
    }

    return id !== '' ? (

            <div>

                <div class="field">
                    <div class="container">

                        <ul id="messages"><Messages data={messages} /></ul>
                    </div>
                    <div class="column is-3">
                        <ul id="online"> <a onClick={()=>logOut()} href='#'><div style={{float:'right'}}></div></a> {online ? '️ You are Online' : 'You are Offline'} <hr/><Online data={onlineList} /> </ul>
                    </div>
                </div>
                <div><button style={{color:'red'}} onClick={()=>logOut()}>Logout</button></div>
                <div id="sendform">
                    <form onSubmit={e => handleSend(e)} style={{display: 'flex'}}>
                        <input id="m" />
                        {width > 1000 ? <button style={{width:'100px'}}  type="submit">Send Message</button> :
                            <button style={{width:'50px'}}><i style={{fontSize:'15px'}} class="material-icons">send</i></button>}
                    </form>

                </div>

              {/*  <div id="sendform">
                    <form style="display: flex; height:"><input id="m" style="height:90px;font-size:20px"></input>
                        <button style="width: 50px;"><i className="material-icons" style="font-size: 15px;">send</i>
                        </button>
                    </form>
                </div>
*/}


            </div>

    ) : (

        <div style={{ textAlign: 'center', margin: '30vh auto', width: '70%' }}>


            <form onSubmit={event => handleSubmit(event)}>
                <FormLabel>User Name : </FormLabel><input size="sm" id="name" />
                <br />
                <FormLabel>Major : </FormLabel>
                <select id = "room" size="sm" >
                    <option value = "Computer Science">Computer Science</option>
                    <option value = "Mathematics">Mathematics</option>
                </select>
                <br/>
                <button type="submit" style={{color:'black', background:'lightgreen' }}>Submit</button>

            </form>
            {/*<form onSubmit={event => handleSubmit(event)}>*/}
                {/*<label>User Name :  </label><input id="name" /><br />*/}

                {/*<br />*/}
                {/*<label> Major :  </label>*/}
                {/*<select id = "room" >*/}
                    {/*<option value = "Computer Science">Computer Science</option>*/}
                    {/*<option value = "Mathematics">Mathematics</option>*/}
                {/*</select>*/}

                {/*<br />*/}
                {/*<br />*/}
                {/*<br />*/}
                {/*<br />*/}
                {/*<br />*/}

                {/*<button type="submit">Submit</button>*/}
            {/*</form>*/}
        </div>

    );
};