"use strict";(self.webpackChunknestjs_cls_docs=self.webpackChunknestjs_cls_docs||[]).push([[776],{3905:(e,t,n)=>{n.d(t,{Zo:()=>p,kt:()=>f});var r=n(7294);function o(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function i(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function a(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?i(Object(n),!0).forEach((function(t){o(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):i(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function s(e,t){if(null==e)return{};var n,r,o=function(e,t){if(null==e)return{};var n,r,o={},i=Object.keys(e);for(r=0;r<i.length;r++)n=i[r],t.indexOf(n)>=0||(o[n]=e[n]);return o}(e,t);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(r=0;r<i.length;r++)n=i[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(o[n]=e[n])}return o}var l=r.createContext({}),c=function(e){var t=r.useContext(l),n=t;return e&&(n="function"==typeof e?e(t):a(a({},t),e)),n},p=function(e){var t=c(e.components);return r.createElement(l.Provider,{value:t},e.children)},u="mdxType",d={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},m=r.forwardRef((function(e,t){var n=e.components,o=e.mdxType,i=e.originalType,l=e.parentName,p=s(e,["components","mdxType","originalType","parentName"]),u=c(n),m=o,f=u["".concat(l,".").concat(m)]||u[m]||d[m]||i;return n?r.createElement(f,a(a({ref:t},p),{},{components:n})):r.createElement(f,a({ref:t},p))}));function f(e,t){var n=arguments,o=t&&t.mdxType;if("string"==typeof e||o){var i=n.length,a=new Array(i);a[0]=m;var s={};for(var l in t)hasOwnProperty.call(t,l)&&(s[l]=t[l]);s.originalType=e,s[u]="string"==typeof e?e:o,a[1]=s;for(var c=2;c<i;c++)a[c]=n[c];return r.createElement.apply(null,a)}return r.createElement.apply(null,n)}m.displayName="MDXCreateElement"},1149:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>l,contentTitle:()=>a,default:()=>d,frontMatter:()=>i,metadata:()=>s,toc:()=>c});var r=n(7462),o=(n(7294),n(3905));const i={},a="Setting up the CLS context",s={unversionedId:"setting-up-cls-context/index",id:"setting-up-cls-context/index",title:"Setting up the CLS context",description:"This package provides three methods of setting up the CLS context for incoming requests. This is mainly due to the fact that different underlying platforms are compatible with only some of these methods - see Compatibility considerations.",source:"@site/docs/02_setting-up-cls-context/index.md",sourceDirName:"02_setting-up-cls-context",slug:"/setting-up-cls-context/",permalink:"/nestjs-cls/setting-up-cls-context/",draft:!1,editUrl:"https://github.com/Papooch/nestjs-cls/tree/main/docs/docs/02_setting-up-cls-context/index.md",tags:[],version:"current",frontMatter:{},sidebar:"documentationSidebar",previous:{title:"How it works",permalink:"/nestjs-cls/introduction/how-it-works"},next:{title:"Using a Middleware",permalink:"/nestjs-cls/setting-up-cls-context/using-a-middleware"}},l={},c=[{value:"Sync",id:"sync",level:2},{value:"Async",id:"async",level:2}],p={toc:c},u="wrapper";function d(e){let{components:t,...n}=e;return(0,o.kt)(u,(0,r.Z)({},p,n,{components:t,mdxType:"MDXLayout"}),(0,o.kt)("h1",{id:"setting-up-the-cls-context"},"Setting up the CLS context"),(0,o.kt)("p",null,"This package provides ",(0,o.kt)("strong",{parentName:"p"},"three")," methods of setting up the CLS context for incoming requests. This is mainly due to the fact that different underlying platforms are compatible with only some of these methods - see ",(0,o.kt)("a",{parentName:"p",href:"/nestjs-cls/considerations/compatibility"},"Compatibility considerations"),"."),(0,o.kt)("p",null,"For HTTP transports, the context can be preferably set up in a ",(0,o.kt)("inlineCode",{parentName:"p"},"ClsMiddleware"),". For all other platforms, or cases where the ",(0,o.kt)("inlineCode",{parentName:"p"},"ClsMiddleware")," is not applicable, this package also provides a ",(0,o.kt)("inlineCode",{parentName:"p"},"ClsGuard")," and ",(0,o.kt)("inlineCode",{parentName:"p"},"ClsInterceptor"),". While both of these also work with HTTP, they come with some caveats, see below."),(0,o.kt)("p",null,"The ",(0,o.kt)("inlineCode",{parentName:"p"},"ClsModule")," provides both ",(0,o.kt)("inlineCode",{parentName:"p"},"forRoot")," and ",(0,o.kt)("inlineCode",{parentName:"p"},"forRootAsync")," methods to configure these."),(0,o.kt)("h2",{id:"sync"},"Sync"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts",metastring:'title="app.module.ts"',title:'"app.module.ts"'},"@Module({\n    imports: [\n        ClsModule.forRoot({\n            global: true,\n            middleware: {\n                mount: true,\n                generateId: true,\n            },\n        }),\n    ],\n    // ...\n})\nexport class AppModule {}\n")),(0,o.kt)("h2",{id:"async"},"Async"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts",metastring:'title="app.module.ts"',title:'"app.module.ts"'},"@Module({\n    imports: [\n        ClsModule.forRootAsync({\n            global: true,\n            inject: [IdGeneratorService]\n            useFactory: (idGeneratorService) => ({\n                middleware: {\n                    mount: true,\n                    generateId: true,\n                    idGenerator: (req) => idGeneratorService.generate(req)\n                },\n            })\n        }),\n    ],\n    // ...\n})\nexport class AppModule {}\n")))}d.isMDXComponent=!0}}]);