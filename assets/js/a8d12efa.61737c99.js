"use strict";(self.webpackChunknestjs_cls_docs=self.webpackChunknestjs_cls_docs||[]).push([[55],{3905:(e,t,n)=>{n.d(t,{Zo:()=>l,kt:()=>m});var r=n(7294);function o(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function a(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function s(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?a(Object(n),!0).forEach((function(t){o(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):a(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function i(e,t){if(null==e)return{};var n,r,o=function(e,t){if(null==e)return{};var n,r,o={},a=Object.keys(e);for(r=0;r<a.length;r++)n=a[r],t.indexOf(n)>=0||(o[n]=e[n]);return o}(e,t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(r=0;r<a.length;r++)n=a[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(o[n]=e[n])}return o}var c=r.createContext({}),u=function(e){var t=r.useContext(c),n=t;return e&&(n="function"==typeof e?e(t):s(s({},t),e)),n},l=function(e){var t=u(e.components);return r.createElement(c.Provider,{value:t},e.children)},p="mdxType",d={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},f=r.forwardRef((function(e,t){var n=e.components,o=e.mdxType,a=e.originalType,c=e.parentName,l=i(e,["components","mdxType","originalType","parentName"]),p=u(n),f=o,m=p["".concat(c,".").concat(f)]||p[f]||d[f]||a;return n?r.createElement(m,s(s({ref:t},l),{},{components:n})):r.createElement(m,s({ref:t},l))}));function m(e,t){var n=arguments,o=t&&t.mdxType;if("string"==typeof e||o){var a=n.length,s=new Array(a);s[0]=f;var i={};for(var c in t)hasOwnProperty.call(t,c)&&(i[c]=t[c]);i.originalType=e,i[p]="string"==typeof e?e:o,s[1]=i;for(var u=2;u<a;u++)s[u]=n[u];return r.createElement.apply(null,s)}return r.createElement.apply(null,n)}f.displayName="MDXCreateElement"},112:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>c,contentTitle:()=>s,default:()=>d,frontMatter:()=>a,metadata:()=>i,toc:()=>u});var r=n(7462),o=(n(7294),n(3905));const a={},s="Usage outside of web request",i={unversionedId:"features-and-use-cases/usage-outside-of-web-request",id:"features-and-use-cases/usage-outside-of-web-request",title:"Usage outside of web request",description:"Sometimes, a part of the app that relies on the CLS storage might need to be called outside of the context of a web request - for example, in a Cron job, while consuming a Queue or during the application bootstrap. In such cases, there are no enhancers that can be bound to the handler to set up the context.",source:"@site/docs/03_features-and-use-cases/04_usage-outside-of-web-request.md",sourceDirName:"03_features-and-use-cases",slug:"/features-and-use-cases/usage-outside-of-web-request",permalink:"/nestjs-cls/features-and-use-cases/usage-outside-of-web-request",draft:!1,editUrl:"https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/docs/03_features-and-use-cases/04_usage-outside-of-web-request.md",tags:[],version:"current",sidebarPosition:4,frontMatter:{},sidebar:"documentationSidebar",previous:{title:"Breaking out of DI",permalink:"/nestjs-cls/features-and-use-cases/breakin-out-of-di"},next:{title:"Type safety and type inference",permalink:"/nestjs-cls/features-and-use-cases/type-safety-and-type-inference"}},c={},u=[],l={toc:u},p="wrapper";function d(e){let{components:t,...n}=e;return(0,o.kt)(p,(0,r.Z)({},l,n,{components:t,mdxType:"MDXLayout"}),(0,o.kt)("h1",{id:"usage-outside-of-web-request"},"Usage outside of web request"),(0,o.kt)("p",null,"Sometimes, a part of the app that relies on the CLS storage might need to be called outside of the context of a web request - for example, in a Cron job, while consuming a Queue or during the application bootstrap. In such cases, there are no enhancers that can be bound to the handler to set up the context."),(0,o.kt)("p",null,"Therefore, you as the the developer are responsible for wrapping the execution with ",(0,o.kt)("inlineCode",{parentName:"p"},"ClsService#run"),", or using the ",(0,o.kt)("inlineCode",{parentName:"p"},"@UseCls")," decorator. In any case, if any following code depends on some context variables, these need to be set up manually."),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"@Injectable()\nexport class CronController {\n    constructor(\n        private readonly someService: SomeService,\n        private readonly cls: ClsService,\n    );\n\n    @Cron('45 * * * * *')\n    async handleCronExample1() {\n        // either explicitly wrap the function body with\n        // a call to `ClsService#run` ...\n        await this.cls.run(async () => {\n            this.cls.set('mode', 'cron');\n            await this.someService.doTheThing();\n        });\n    }\n\n    @Cron('90 * * * * *')\n    // ... or use the convenience decorator which\n    // does the wrapping for you seamlessly.\n    @UseCls({\n        setup: (cls) => {\n            cls.set('mode', 'cron');\n        },\n    })\n    async handleCronExample2() {\n        await this.someService.doTheThing();\n    }\n}\n")),(0,o.kt)("admonition",{type:"caution"},(0,o.kt)("p",{parentName:"admonition"},"Special care must be taken in case you're using ",(0,o.kt)("a",{parentName:"p",href:"/nestjs-cls/features-and-use-cases/proxy-providers#outside-web-request"},"Proxy Providers"),".")))}d.isMDXComponent=!0}}]);