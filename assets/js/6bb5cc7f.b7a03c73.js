"use strict";(self.webpackChunknestjs_cls_docs=self.webpackChunknestjs_cls_docs||[]).push([[499],{6035:(e,t,s)=>{s.r(t),s.d(t,{assets:()=>r,contentTitle:()=>c,default:()=>l,frontMatter:()=>i,metadata:()=>a,toc:()=>d});var n=s(4246),o=s(1670);const i={},c="Breaking out of DI",a={id:"features-and-use-cases/breaking-out-of-di",title:"Breaking out of DI",description:"While this package aims to be compatible with NestJS's Dependency Injection, it is also possible to access the CLS context outside of it.",source:"@site/docs/03_features-and-use-cases/03_breaking-out-of-di.md",sourceDirName:"03_features-and-use-cases",slug:"/features-and-use-cases/breaking-out-of-di",permalink:"/nestjs-cls/features-and-use-cases/breaking-out-of-di",draft:!1,unlisted:!1,editUrl:"https://github.com/Papooch/nestjs-cls/tree/main/docs/docs/03_features-and-use-cases/03_breaking-out-of-di.md",tags:[],version:"current",sidebarPosition:3,frontMatter:{},sidebar:"documentationSidebar",previous:{title:"Additional CLS Setup",permalink:"/nestjs-cls/features-and-use-cases/additional-cls-setup"},next:{title:"Usage outside of web request",permalink:"/nestjs-cls/features-and-use-cases/usage-outside-of-web-request"}},r={},d=[];function u(e){const t={admonition:"admonition",code:"code",h1:"h1",p:"p",pre:"pre",strong:"strong",...(0,o.a)(),...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(t.h1,{id:"breaking-out-of-di",children:"Breaking out of DI"}),"\n",(0,n.jsx)(t.p,{children:"While this package aims to be compatible with NestJS's Dependency Injection, it is also possible to access the CLS context outside of it."}),"\n",(0,n.jsxs)(t.p,{children:["For that, it provides the static ",(0,n.jsx)(t.code,{children:"ClsServiceManager"})," class that exposes the ",(0,n.jsx)(t.code,{children:"getClsService()"})," method which can be used to retrieve the context outside of Nest's injection context (e.g. in top-level functions)"]}),"\n",(0,n.jsx)(t.pre,{children:(0,n.jsx)(t.code,{className:"language-ts",children:"function helper() {\n    const cls = ClsServiceManager.getClsService();\n    // you now have access to the shared storage\n    console.log(cls.getId());\n}\n"})}),"\n",(0,n.jsx)(t.admonition,{type:"caution",children:(0,n.jsxs)(t.p,{children:[(0,n.jsx)(t.strong,{children:"Please note"}),": Only use this feature where absolutely necessary. Using this technique instead of dependency injection will make it difficult to mock the ClsService and your code will become harder to test."]})})]})}function l(e={}){const{wrapper:t}={...(0,o.a)(),...e.components};return t?(0,n.jsx)(t,{...e,children:(0,n.jsx)(u,{...e})}):u(e)}},1670:(e,t,s)=>{s.d(t,{Z:()=>a,a:()=>c});var n=s(7378);const o={},i=n.createContext(o);function c(e){const t=n.useContext(i);return n.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function a(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(o):e.components||o:c(e.components),n.createElement(i.Provider,{value:t},e.children)}}}]);