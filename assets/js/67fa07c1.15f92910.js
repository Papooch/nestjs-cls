"use strict";(self.webpackChunknestjs_cls_docs=self.webpackChunknestjs_cls_docs||[]).push([[164],{3905:(e,t,r)=>{r.d(t,{Zo:()=>l,kt:()=>f});var n=r(7294);function o(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function a(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}function i(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?a(Object(r),!0).forEach((function(t){o(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):a(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function s(e,t){if(null==e)return{};var r,n,o=function(e,t){if(null==e)return{};var r,n,o={},a=Object.keys(e);for(n=0;n<a.length;n++)r=a[n],t.indexOf(r)>=0||(o[r]=e[r]);return o}(e,t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(n=0;n<a.length;n++)r=a[n],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(o[r]=e[r])}return o}var c=n.createContext({}),p=function(e){var t=n.useContext(c),r=t;return e&&(r="function"==typeof e?e(t):i(i({},t),e)),r},l=function(e){var t=p(e.components);return n.createElement(c.Provider,{value:t},e.children)},u="mdxType",m={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},d=n.forwardRef((function(e,t){var r=e.components,o=e.mdxType,a=e.originalType,c=e.parentName,l=s(e,["components","mdxType","originalType","parentName"]),u=p(r),d=o,f=u["".concat(c,".").concat(d)]||u[d]||m[d]||a;return r?n.createElement(f,i(i({ref:t},l),{},{components:r})):n.createElement(f,i({ref:t},l))}));function f(e,t){var r=arguments,o=t&&t.mdxType;if("string"==typeof e||o){var a=r.length,i=new Array(a);i[0]=d;var s={};for(var c in t)hasOwnProperty.call(t,c)&&(s[c]=t[c]);s.originalType=e,s[u]="string"==typeof e?e:o,i[1]=s;for(var p=2;p<a;p++)i[p]=r[p];return n.createElement.apply(null,i)}return n.createElement.apply(null,r)}d.displayName="MDXCreateElement"},2789:(e,t,r)=>{r.r(t),r.d(t,{assets:()=>c,contentTitle:()=>i,default:()=>m,frontMatter:()=>a,metadata:()=>s,toc:()=>p});var n=r(7462),o=(r(7294),r(3905));const a={},i="v2.x \u2192 v3.x",s={unversionedId:"migration-guide/v2x-v3x",id:"migration-guide/v2x-v3x",title:"v2.x \u2192 v3.x",description:"-   The root registration method was renamed from register (resp. registerAsync) to forRoot (resp. forRootAsync) to align with the convention.",source:"@site/docs/06_migration-guide/01_v2x-v3x.md",sourceDirName:"06_migration-guide",slug:"/migration-guide/v2x-v3x",permalink:"/nestjs-cls/migration-guide/v2x-v3x",draft:!1,editUrl:"https://github.com/Papooch/nestjs-cls/tree/main/docs/docs/06_migration-guide/01_v2x-v3x.md",tags:[],version:"current",sidebarPosition:1,frontMatter:{},sidebar:"documentationSidebar",previous:{title:"Migration guide",permalink:"/nestjs-cls/migration-guide/"}},c={},p=[],l={toc:p},u="wrapper";function m(e){let{components:t,...r}=e;return(0,o.kt)(u,(0,n.Z)({},l,r,{components:t,mdxType:"MDXLayout"}),(0,o.kt)("h1",{id:"v2x--v3x"},(0,o.kt)("inlineCode",{parentName:"h1"},"v2.x")," \u2192 ",(0,o.kt)("inlineCode",{parentName:"h1"},"v3.x")),(0,o.kt)("ul",null,(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("p",{parentName:"li"},"The root registration method was ",(0,o.kt)("em",{parentName:"p"},"renamed")," from ",(0,o.kt)("inlineCode",{parentName:"p"},"register")," (resp. ",(0,o.kt)("inlineCode",{parentName:"p"},"registerAsync"),") to ",(0,o.kt)("inlineCode",{parentName:"p"},"forRoot")," (resp. ",(0,o.kt)("inlineCode",{parentName:"p"},"forRootAsync"),") to align with the convention."),(0,o.kt)("pre",{parentName:"li"},(0,o.kt)("code",{parentName:"pre",className:"language-diff"},"// highlight-start\n- ClsModule.register({\n+ ClsModule.forRoot({\n// highlight-end\n      middleware: { mount: true },\n  }),\n"))),(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("p",{parentName:"li"},"Namespace injection support with ",(0,o.kt)("inlineCode",{parentName:"p"},"forFeature")," was dropped entirely, and now that method is used to register ",(0,o.kt)("a",{parentName:"p",href:"/nestjs-cls/features-and-use-cases/proxy-providers"},"Proxy Providers"),". If you still have a use case for namespaces, you can create a namespaced ",(0,o.kt)("inlineCode",{parentName:"p"},"ClsService")," and use a custom provider to inject it.",(0,o.kt)("br",{parentName:"p"}),"\n","Example:"),(0,o.kt)("pre",{parentName:"li"},(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"class MyContextService extends ClsService<MyStore> {}\nconst myContextService = new MyContextService(new AsyncLocalStorage());\n\n// [...]\nproviders: [\n    {\n        provide: MyContextService,\n        useValue: myContextService,\n    },\n];\n")))))}m.isMDXComponent=!0}}]);