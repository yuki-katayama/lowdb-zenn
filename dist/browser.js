(()=>{"use strict";class t{#t;#e;constructor(t,e){this.#t=t,this.#e=e}read(){const t=this.#e.getItem(this.#t);return null===t?null:JSON.parse(t)}write(t){this.#e.setItem(this.#t,JSON.stringify(t))}}class e extends t{constructor(t){super(t,localStorage)}}class s extends t{constructor(t){super(t,sessionStorage)}}class a{adapter;data;constructor(t,e){(function(t,e){if(void 0===t)throw new Error("lowdb: missing adapter");if(void 0===e)throw new Error("lowdb: missing default data")})(t,e),this.adapter=t,this.data=e}read(){const t=this.adapter.read();t&&(this.data=t)}write(){this.data&&this.adapter.write(this.data)}update(t){t(this.data),this.write()}}const r="myWebStorageDB",n={posts:[],user:{name:"",age:0}},i=function(t,s){const r=new e(t),n=new a(r,s);return n.read(),n}(r,n),o=function(t,e){const r=new s(t),n=new a(r,e);return n.read(),n}(r,n);(async()=>{i.read(),i.data||=n,i.data.posts.push({id:1,title:"zenn",published:!1}),i.write(),o.read(),o.data||=n,o.data.posts.push({id:1,title:"zenn",published:!1}),o.write();const t=document.getElementById("local-output"),e=document.getElementById("session-output");t.textContent=JSON.stringify(i.data,null,2),e.textContent=JSON.stringify(i.data,null,2)})()})();