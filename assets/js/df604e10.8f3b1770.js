"use strict";(self.webpackChunknestjs_cls=self.webpackChunknestjs_cls||[]).push([[775],{3905:(e,t,n)=>{n.d(t,{Zo:()=>c,kt:()=>d});var r=n(7294);function a(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function i(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function p(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?i(Object(n),!0).forEach((function(t){a(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):i(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function o(e,t){if(null==e)return{};var n,r,a=function(e,t){if(null==e)return{};var n,r,a={},i=Object.keys(e);for(r=0;r<i.length;r++)n=i[r],t.indexOf(n)>=0||(a[n]=e[n]);return a}(e,t);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(r=0;r<i.length;r++)n=i[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(a[n]=e[n])}return a}var l=r.createContext({}),m=function(e){var t=r.useContext(l),n=t;return e&&(n="function"==typeof e?e(t):p(p({},t),e)),n},c=function(e){var t=m(e.components);return r.createElement(l.Provider,{value:t},e.children)},s="mdxType",k={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},u=r.forwardRef((function(e,t){var n=e.components,a=e.mdxType,i=e.originalType,l=e.parentName,c=o(e,["components","mdxType","originalType","parentName"]),s=m(n),u=a,d=s["".concat(l,".").concat(u)]||s[u]||k[u]||i;return n?r.createElement(d,p(p({ref:t},c),{},{components:n})):r.createElement(d,p({ref:t},c))}));function d(e,t){var n=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var i=n.length,p=new Array(i);p[0]=u;var o={};for(var l in t)hasOwnProperty.call(t,l)&&(o[l]=t[l]);o.originalType=e,o[s]="string"==typeof e?e:a,p[1]=o;for(var m=2;m<i;m++)p[m]=n[m];return r.createElement.apply(null,p)}return r.createElement.apply(null,n)}u.displayName="MDXCreateElement"},9579:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>l,contentTitle:()=>p,default:()=>k,frontMatter:()=>i,metadata:()=>o,toc:()=>m});var r=n(7462),a=(n(7294),n(3905));const i={},p="Service Interface",o={unversionedId:"api/service-interface",id:"api/service-interface",title:"Service Interface",description:"The injectable ClsService provides the following API to manipulate the cls context:",source:"@site/docs/04_api/01_service-interface.md",sourceDirName:"04_api",slug:"/api/service-interface",permalink:"/nestjs-cls/api/service-interface",draft:!1,editUrl:"https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/docs/04_api/01_service-interface.md",tags:[],version:"current",sidebarPosition:1,frontMatter:{},sidebar:"documentationSidebar",previous:{title:"API",permalink:"/nestjs-cls/api/"},next:{title:"Module Options",permalink:"/nestjs-cls/api/module-options"}},l={},m=[],c={toc:m},s="wrapper";function k(e){let{components:t,...n}=e;return(0,a.kt)(s,(0,r.Z)({},c,n,{components:t,mdxType:"MDXLayout"}),(0,a.kt)("h1",{id:"service-interface"},"Service Interface"),(0,a.kt)("p",null,"The injectable ",(0,a.kt)("inlineCode",{parentName:"p"},"ClsService")," provides the following API to manipulate the cls context:"),(0,a.kt)("p",null,"The ",(0,a.kt)("inlineCode",{parentName:"p"},"S")," type parameter is used as the type of custom ",(0,a.kt)("inlineCode",{parentName:"p"},"ClsStore"),"."),(0,a.kt)("ul",null,(0,a.kt)("li",{parentName:"ul"},(0,a.kt)("p",{parentName:"li"},(0,a.kt)("strong",{parentName:"p"},(0,a.kt)("em",{parentName:"strong"},(0,a.kt)("inlineCode",{parentName:"em"},"set"))),(0,a.kt)("inlineCode",{parentName:"p"},"(key: keyof S, value: S[key]): void"),(0,a.kt)("br",{parentName:"p"}),"\n","Set a value on the CLS context.")),(0,a.kt)("li",{parentName:"ul"},(0,a.kt)("p",{parentName:"li"},(0,a.kt)("strong",{parentName:"p"},(0,a.kt)("em",{parentName:"strong"},(0,a.kt)("inlineCode",{parentName:"em"},"get"))),(0,a.kt)("inlineCode",{parentName:"p"},"(): S"),(0,a.kt)("br",{parentName:"p"}),"\n","Get the entire CLS context.")),(0,a.kt)("li",{parentName:"ul"},(0,a.kt)("p",{parentName:"li"},(0,a.kt)("strong",{parentName:"p"},(0,a.kt)("em",{parentName:"strong"},(0,a.kt)("inlineCode",{parentName:"em"},"get"))),(0,a.kt)("inlineCode",{parentName:"p"},"(key?: keyof S): S[key]"),(0,a.kt)("br",{parentName:"p"}),"\n","Retrieve a value from the CLS context by key.")),(0,a.kt)("li",{parentName:"ul"},(0,a.kt)("p",{parentName:"li"},(0,a.kt)("strong",{parentName:"p"},(0,a.kt)("em",{parentName:"strong"},(0,a.kt)("inlineCode",{parentName:"em"},"has"))),(0,a.kt)("inlineCode",{parentName:"p"},"(key: keyof S): boolean"),(0,a.kt)("br",{parentName:"p"}),"\n","Check if a key is in the CLS context.")),(0,a.kt)("li",{parentName:"ul"},(0,a.kt)("p",{parentName:"li"},(0,a.kt)("strong",{parentName:"p"},(0,a.kt)("em",{parentName:"strong"},(0,a.kt)("inlineCode",{parentName:"em"},"getId"))),(0,a.kt)("inlineCode",{parentName:"p"},"(): string;"),(0,a.kt)("br",{parentName:"p"}),"\n","Retrieve the request ID (a shorthand for ",(0,a.kt)("inlineCode",{parentName:"p"},"cls.get(CLS_ID)"),")")),(0,a.kt)("li",{parentName:"ul"},(0,a.kt)("p",{parentName:"li"},(0,a.kt)("strong",{parentName:"p"},(0,a.kt)("em",{parentName:"strong"},(0,a.kt)("inlineCode",{parentName:"em"},"enter"))),(0,a.kt)("inlineCode",{parentName:"p"},"(): void;"),(0,a.kt)("br",{parentName:"p"}),"\n","Run any following code in a shared CLS context.")),(0,a.kt)("li",{parentName:"ul"},(0,a.kt)("p",{parentName:"li"},(0,a.kt)("strong",{parentName:"p"},(0,a.kt)("em",{parentName:"strong"},(0,a.kt)("inlineCode",{parentName:"em"},"enterWith"))),(0,a.kt)("inlineCode",{parentName:"p"},"(store: S): void;"),(0,a.kt)("br",{parentName:"p"}),"\n","Run any following code in a new CLS context (while supplying the default store).")),(0,a.kt)("li",{parentName:"ul"},(0,a.kt)("p",{parentName:"li"},(0,a.kt)("strong",{parentName:"p"},(0,a.kt)("em",{parentName:"strong"},(0,a.kt)("inlineCode",{parentName:"em"},"run"))),(0,a.kt)("inlineCode",{parentName:"p"},"(callback: () => T): T;"),(0,a.kt)("br",{parentName:"p"}),"\n","Run the callback in a shared CLS context.")),(0,a.kt)("li",{parentName:"ul"},(0,a.kt)("p",{parentName:"li"},(0,a.kt)("strong",{parentName:"p"},(0,a.kt)("em",{parentName:"strong"},(0,a.kt)("inlineCode",{parentName:"em"},"runWith"))),(0,a.kt)("inlineCode",{parentName:"p"},"(store: S, callback: () => T): T;"),(0,a.kt)("br",{parentName:"p"}),"\n","Run the callback in a new CLS context (while supplying the default store).")),(0,a.kt)("li",{parentName:"ul"},(0,a.kt)("p",{parentName:"li"},(0,a.kt)("strong",{parentName:"p"},(0,a.kt)("em",{parentName:"strong"},(0,a.kt)("inlineCode",{parentName:"em"},"isActive"))),(0,a.kt)("inlineCode",{parentName:"p"},"(): boolean"),(0,a.kt)("br",{parentName:"p"}),"\n","Whether the current code runs within an active CLS context.")),(0,a.kt)("li",{parentName:"ul"},(0,a.kt)("p",{parentName:"li"},(0,a.kt)("strong",{parentName:"p"},(0,a.kt)("em",{parentName:"strong"},(0,a.kt)("inlineCode",{parentName:"em"},"resolveProxyProviders"))),(0,a.kt)("inlineCode",{parentName:"p"},"(): Promise<void>"),(0,a.kt)("br",{parentName:"p"}),"\n","Manually trigger resolution of Proxy Providers."))))}k.isMDXComponent=!0}}]);