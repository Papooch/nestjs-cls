"use strict";(self.webpackChunknestjs_cls_docs=self.webpackChunknestjs_cls_docs||[]).push([[4550],{3803:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>c,contentTitle:()=>d,default:()=>p,frontMatter:()=>i,metadata:()=>r,toc:()=>a});const r=JSON.parse('{"id":"migration-guide/v2x-v3x","title":"v2.x \u2192 v3.x","description":"Root registration method renamed","source":"@site/docs/10_migration-guide/03_v2x-v3x.md","sourceDirName":"10_migration-guide","slug":"/migration-guide/v2x-v3x","permalink":"/nestjs-cls/migration-guide/v2x-v3x","draft":false,"unlisted":false,"editUrl":"https://github.com/Papooch/nestjs-cls/tree/main/docs/docs/10_migration-guide/03_v2x-v3x.md","tags":[],"version":"current","sidebarPosition":3,"frontMatter":{},"sidebar":"documentationSidebar","previous":{"title":"v3.x \u2192 v4.x","permalink":"/nestjs-cls/migration-guide/v3x-v4x"}}');var s=t(2540),o=t(3023);const i={},d="v2.x \u2192 v3.x",c={},a=[{value:"Root registration method renamed",id:"root-registration-method-renamed",level:2},{value:"Namespace support dropped",id:"namespace-support-dropped",level:2}];function l(e){const n={a:"a",br:"br",code:"code",em:"em",h1:"h1",h2:"h2",header:"header",li:"li",p:"p",pre:"pre",ul:"ul",...(0,o.R)(),...e.components};return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(n.header,{children:(0,s.jsxs)(n.h1,{id:"v2x--v3x",children:[(0,s.jsx)(n.code,{children:"v2.x"})," \u2192 ",(0,s.jsx)(n.code,{children:"v3.x"})]})}),"\n",(0,s.jsx)(n.h2,{id:"root-registration-method-renamed",children:"Root registration method renamed"}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:["The root registration method was ",(0,s.jsx)(n.em,{children:"renamed"})," from ",(0,s.jsx)(n.code,{children:"register"})," (resp. ",(0,s.jsx)(n.code,{children:"registerAsync"}),") to ",(0,s.jsx)(n.code,{children:"forRoot"})," (resp. ",(0,s.jsx)(n.code,{children:"forRootAsync"}),") to align with the convention."]}),"\n"]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-diff",children:"// highlight-start\n- ClsModule.register({\n+ ClsModule.forRoot({\n// highlight-end\n        middleware: { mount: true },\n  }),\n"})}),"\n",(0,s.jsx)(n.h2,{id:"namespace-support-dropped",children:"Namespace support dropped"}),"\n",(0,s.jsxs)(n.p,{children:["Namespace injection support with ",(0,s.jsx)(n.code,{children:"forFeature"})," was dropped entirely, and now that method is used to register ",(0,s.jsx)(n.a,{href:"/nestjs-cls/features-and-use-cases/proxy-providers",children:"Proxy Providers"}),". If you still have a use case for namespaces, you can create a namespaced ",(0,s.jsx)(n.code,{children:"ClsService"})," and use a custom provider to inject it.",(0,s.jsx)(n.br,{}),"\n","Example:"]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-ts",children:"class MyContextService extends ClsService<MyStore> {}\nconst myContextService = new MyContextService(new AsyncLocalStorage());\n\n// [...]\nproviders: [\n    {\n        provide: MyContextService,\n        useValue: myContextService,\n    },\n];\n"})})]})}function p(e={}){const{wrapper:n}={...(0,o.R)(),...e.components};return n?(0,s.jsx)(n,{...e,children:(0,s.jsx)(l,{...e})}):l(e)}},3023:(e,n,t)=>{t.d(n,{R:()=>i,x:()=>d});var r=t(3696);const s={},o=r.createContext(s);function i(e){const n=r.useContext(o);return r.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function d(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(s):e.components||s:i(e.components),r.createElement(o.Provider,{value:n},e.children)}}}]);