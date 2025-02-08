"use strict";(self.webpackChunknestjs_cls_docs=self.webpackChunknestjs_cls_docs||[]).push([[5489],{2187:(e,o,n)=>{n.r(o),n.d(o,{assets:()=>l,contentTitle:()=>c,default:()=>h,frontMatter:()=>i,metadata:()=>s,toc:()=>d});const s=JSON.parse('{"id":"considerations/for-library-authors","title":"For library authors","description":"If you are developing a library that depends on nestjs-cls, please make sure of the following:","source":"@site/docs/05_considerations/03_for-library-authors.md","sourceDirName":"05_considerations","slug":"/considerations/for-library-authors","permalink":"/nestjs-cls/considerations/for-library-authors","draft":false,"unlisted":false,"editUrl":"https://github.com/Papooch/nestjs-cls/tree/main/docs/docs/05_considerations/03_for-library-authors.md","tags":[],"version":"current","sidebarPosition":3,"frontMatter":{},"sidebar":"documentationSidebar","previous":{"title":"Compatibility","permalink":"/nestjs-cls/considerations/compatibility"},"next":{"title":"Plugins","permalink":"/nestjs-cls/plugins/"}}');var t=n(2540),r=n(3023);const i={},c="For library authors",l={},d=[{value:"Use peer dependency",id:"use-peer-dependency",level:2},{value:"Do not import <code>forRoot</code>",id:"do-not-import-forroot",level:2}];function a(e){const o={a:"a",code:"code",h1:"h1",h2:"h2",header:"header",p:"p",...(0,r.R)(),...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(o.header,{children:(0,t.jsx)(o.h1,{id:"for-library-authors",children:"For library authors"})}),"\n",(0,t.jsxs)(o.p,{children:["If you are developing a library that depends on ",(0,t.jsx)(o.code,{children:"nestjs-cls"}),", please make sure of the following:"]}),"\n",(0,t.jsx)(o.h2,{id:"use-peer-dependency",children:"Use peer dependency"}),"\n",(0,t.jsxs)(o.p,{children:["List ",(0,t.jsx)(o.code,{children:"nestjs-cls"})," as a peer dependency in your ",(0,t.jsx)(o.code,{children:"package.json"})," (under ",(0,t.jsx)(o.code,{children:"peerDependencies"}),"), this prevents multiple instances of the library from being installed in the same project, which can lead to dependency injection errors and loss of context."]}),"\n",(0,t.jsxs)(o.h2,{id:"do-not-import-forroot",children:["Do not import ",(0,t.jsx)(o.code,{children:"forRoot"})]}),"\n",(0,t.jsxs)(o.p,{children:["In your library, never import the module as ",(0,t.jsx)(o.code,{children:"ClsModule.forRoot()"})," or ",(0,t.jsx)(o.code,{children:"ClsModule.forRootAsync()"}),". This prevents the application from setting up the ",(0,t.jsx)(o.code,{children:"nestjs-cls"})," library correctly."]}),"\n",(0,t.jsxs)(o.p,{children:["As with most other modules, importing a module ",(0,t.jsx)(o.code,{children:"forRoot()"})," configures some global state, which can lead to unexpected behavior when used multiple times."]}),"\n",(0,t.jsxs)(o.p,{children:["If your library code needs to inject ",(0,t.jsx)(o.code,{children:"ClsService"}),", it should be done by importing the ",(0,t.jsx)(o.code,{children:"ClsModule"})," statically, without calling ",(0,t.jsx)(o.code,{children:"forRoot()"}),"."]}),"\n",(0,t.jsxs)(o.p,{children:["If you need to hook into the ",(0,t.jsx)(o.code,{children:"setup"})," function to enrich the context, you can provide a custom function that the user must call manually, or provide a custom ",(0,t.jsx)(o.a,{href:"/nestjs-cls/plugins/",children:"Plugin"})," and implement the ",(0,t.jsx)(o.code,{children:"onClsInit"})," method, which is called right after ",(0,t.jsx)(o.code,{children:"setup"})," in all enhancers."]})]})}function h(e={}){const{wrapper:o}={...(0,r.R)(),...e.components};return o?(0,t.jsx)(o,{...e,children:(0,t.jsx)(a,{...e})}):a(e)}},3023:(e,o,n)=>{n.d(o,{R:()=>i,x:()=>c});var s=n(3696);const t={},r=s.createContext(t);function i(e){const o=s.useContext(r);return s.useMemo((function(){return"function"==typeof e?e(o):{...o,...e}}),[o,e])}function c(e){let o;return o=e.disableParentContext?"function"==typeof e.components?e.components(t):e.components||t:i(e.components),s.createElement(r.Provider,{value:o},e.children)}}}]);