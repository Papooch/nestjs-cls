"use strict";(self.webpackChunknestjs_cls_docs=self.webpackChunknestjs_cls_docs||[]).push([[446],{5834:(e,n,s)=>{s.r(n),s.d(n,{assets:()=>r,contentTitle:()=>a,default:()=>d,frontMatter:()=>t,metadata:()=>o,toc:()=>c});var i=s(4246),l=s(1670);const t={},a="Plugins",o={id:"plugins/index",title:"Plugins",description:"Since v4.0",source:"@site/docs/06_plugins/index.md",sourceDirName:"06_plugins",slug:"/plugins/",permalink:"/nestjs-cls/plugins/",draft:!1,unlisted:!1,editUrl:"https://github.com/Papooch/nestjs-cls/tree/main/docs/docs/06_plugins/index.md",tags:[],version:"current",frontMatter:{},sidebar:"documentationSidebar",previous:{title:"Compatibility",permalink:"/nestjs-cls/considerations/compatibility"},next:{title:"Available Plugins",permalink:"/nestjs-cls/plugins/available-plugins/"}},r={},c=[{value:"Usage",id:"usage",level:2},{value:"Available plugins",id:"available-plugins",level:2},{value:"Creating a plugin",id:"creating-a-plugin",level:2}];function u(e){const n={a:"a",code:"code",em:"em",h1:"h1",h2:"h2",p:"p",pre:"pre",strong:"strong",...(0,l.a)(),...e.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(n.h1,{id:"plugins",children:"Plugins"}),"\n",(0,i.jsx)("small",{children:(0,i.jsxs)(n.strong,{children:["Since ",(0,i.jsx)(n.code,{children:"v4.0"})]})}),"\n",(0,i.jsx)(n.p,{children:"Plugins are a way to enable pre-built integrations with other libraries and frameworks. They are a convenient way to enable many real-world use-cases without having to write much boilerplate code."}),"\n",(0,i.jsxs)(n.p,{children:["Plugins can hook into the lifecycle of the ",(0,i.jsx)(n.code,{children:"ClsModule"})," and the CLS context setup of the ",(0,i.jsx)(n.code,{children:"Cls-"})," initializers. They can also provide their own ",(0,i.jsx)(n.em,{children:"Proxy-"})," and regular providers to be used in the application."]}),"\n",(0,i.jsx)(n.h2,{id:"usage",children:"Usage"}),"\n",(0,i.jsxs)(n.p,{children:["To use a plugin, pass it to the ",(0,i.jsx)(n.code,{children:"forRoot"})," method of the ",(0,i.jsx)(n.code,{children:"ClsModule"}),":"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-ts",children:"ClsModule.forRoot({\n    // highlight-start\n    plugins: [new MyPlugin()],\n    // highlight-end\n});\n"})}),"\n",(0,i.jsx)(n.h2,{id:"available-plugins",children:"Available plugins"}),"\n",(0,i.jsxs)(n.p,{children:["For a list of plugins managed by the author of ",(0,i.jsx)(n.code,{children:"nestjs-cls"}),", see the ",(0,i.jsx)(n.a,{href:"/nestjs-cls/plugins/available-plugins/",children:"Available Plugins"})," page."]}),"\n",(0,i.jsx)(n.h2,{id:"creating-a-plugin",children:"Creating a plugin"}),"\n",(0,i.jsxs)(n.p,{children:["To create a custom plugin, see the ",(0,i.jsx)(n.a,{href:"/nestjs-cls/plugins/plugin-api",children:"Plugin API"})," reference."]})]})}function d(e={}){const{wrapper:n}={...(0,l.a)(),...e.components};return n?(0,i.jsx)(n,{...e,children:(0,i.jsx)(u,{...e})}):u(e)}},1670:(e,n,s)=>{s.d(n,{Z:()=>o,a:()=>a});var i=s(7378);const l={},t=i.createContext(l);function a(e){const n=i.useContext(t);return i.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function o(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(l):e.components||l:a(e.components),i.createElement(t.Provider,{value:n},e.children)}}}]);