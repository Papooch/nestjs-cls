"use strict";(self.webpackChunknestjs_cls_docs=self.webpackChunknestjs_cls_docs||[]).push([[2047],{3988:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>c,contentTitle:()=>r,default:()=>u,frontMatter:()=>o,metadata:()=>a,toc:()=>l});var s=n(4246),i=n(1670);const o={},r="Using a Guard",a={id:"setting-up-cls-context/using-a-guard",title:"Using a Guard",description:'The ClsGuard can be also used set up the CLS context. While it is not a "guard" per-se, it\'s the second best place to set up the CLS context, since after a middleware, it is the first piece of code that the request hits.',source:"@site/docs/02_setting-up-cls-context/02_using-a-guard.md",sourceDirName:"02_setting-up-cls-context",slug:"/setting-up-cls-context/using-a-guard",permalink:"/nestjs-cls/setting-up-cls-context/using-a-guard",draft:!1,unlisted:!1,editUrl:"https://github.com/Papooch/nestjs-cls/tree/main/docs/docs/02_setting-up-cls-context/02_using-a-guard.md",tags:[],version:"current",sidebarPosition:2,frontMatter:{},sidebar:"documentationSidebar",previous:{title:"Using a Middleware",permalink:"/nestjs-cls/setting-up-cls-context/using-a-middleware"},next:{title:"Using an Interceptor",permalink:"/nestjs-cls/setting-up-cls-context/using-an-interceptor"}},c={},l=[{value:"Automatically",id:"automatically",level:2},{value:"Manually",id:"manually",level:2}];function d(e){const t={a:"a",admonition:"admonition",code:"code",h1:"h1",h2:"h2",p:"p",pre:"pre",strong:"strong",...(0,i.a)(),...e.components};return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(t.h1,{id:"using-a-guard",children:"Using a Guard"}),"\n",(0,s.jsxs)(t.p,{children:["The ",(0,s.jsx)(t.code,{children:"ClsGuard"}),' can be also used set up the CLS context. While it is not a "guard" per-se, it\'s the second best place to set up the CLS context, since after a middleware, it is the first piece of code that the request hits.']}),"\n",(0,s.jsxs)(t.p,{children:["To use it, pass its configuration to the ",(0,s.jsx)(t.code,{children:"guard"})," property to the ",(0,s.jsx)(t.code,{children:"ClsModule.forRoot()"})," options:"]}),"\n",(0,s.jsx)(t.h2,{id:"automatically",children:"Automatically"}),"\n",(0,s.jsxs)(t.p,{children:["Use ",(0,s.jsx)(t.code,{children:"mount: true"})]}),"\n",(0,s.jsx)(t.pre,{children:(0,s.jsx)(t.code,{className:"language-ts",metastring:'title="app.module.ts"',children:"@Module({\n    imports: [\n        ClsModule.forRoot({\n            // highlight-start\n            guard: { mount: true },\n            // highlight-end\n        }),\n    ],\n    // ...\n})\nexport class AppModule {}\n"})}),"\n",(0,s.jsx)(t.h2,{id:"manually",children:"Manually"}),"\n",(0,s.jsxs)(t.p,{children:["If you need any other guards to use the ",(0,s.jsx)(t.code,{children:"ClsService"}),", it's preferable to mount ",(0,s.jsx)(t.code,{children:"ClsGuard"})," manually as the first guard in the root module:"]}),"\n",(0,s.jsx)(t.pre,{children:(0,s.jsx)(t.code,{className:"language-ts",metastring:'title="app.module.ts"',children:"@Module({\n    imports: [\n        ClsModule.forRoot({\n                        // highlight-start\n            guard: { mount: false }\n                        // highlight-end\n        }),\n    ]\n    providers: [\n        {\n            // highlight-start\n            provide: APP_GUARD,\n            useClass: ClsGuard,\n            // highlight-end\n        },\n    ],\n    // ...\n})\nexport class AppModule {}\n"})}),"\n",(0,s.jsx)(t.p,{children:"or mount it directly on the Controller/Resolver with"}),"\n",(0,s.jsx)(t.pre,{children:(0,s.jsx)(t.code,{className:"language-ts",children:"@UseGuards(ClsGuard);\n"})}),"\n",(0,s.jsx)(t.admonition,{type:"caution",children:(0,s.jsxs)(t.p,{children:[(0,s.jsx)(t.strong,{children:"Please note"}),": since the ",(0,s.jsx)(t.code,{children:"ClsGuard"})," uses the ",(0,s.jsx)(t.code,{children:"AsyncLocalStorage#enterWith"})," method, using the ",(0,s.jsx)(t.code,{children:"ClsGuard"})," comes with some ",(0,s.jsx)(t.a,{href:"/nestjs-cls/considerations/security",children:"security considerations"}),"!"]})})]})}function u(e={}){const{wrapper:t}={...(0,i.a)(),...e.components};return t?(0,s.jsx)(t,{...e,children:(0,s.jsx)(d,{...e})}):d(e)}},1670:(e,t,n)=>{n.d(t,{Z:()=>a,a:()=>r});var s=n(7378);const i={},o=s.createContext(i);function r(e){const t=s.useContext(o);return s.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function a(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:r(e.components),s.createElement(o.Provider,{value:t},e.children)}}}]);