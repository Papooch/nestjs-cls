"use strict";(self.webpackChunknestjs_cls_docs=self.webpackChunknestjs_cls_docs||[]).push([[873],{3905:(e,t,n)=>{n.d(t,{Zo:()=>p,kt:()=>m});var r=n(7294);function i(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function o(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function a(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?o(Object(n),!0).forEach((function(t){i(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):o(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function s(e,t){if(null==e)return{};var n,r,i=function(e,t){if(null==e)return{};var n,r,i={},o=Object.keys(e);for(r=0;r<o.length;r++)n=o[r],t.indexOf(n)>=0||(i[n]=e[n]);return i}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(r=0;r<o.length;r++)n=o[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(i[n]=e[n])}return i}var l=r.createContext({}),c=function(e){var t=r.useContext(l),n=t;return e&&(n="function"==typeof e?e(t):a(a({},t),e)),n},p=function(e){var t=c(e.components);return r.createElement(l.Provider,{value:t},e.children)},u="mdxType",d={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},h=r.forwardRef((function(e,t){var n=e.components,i=e.mdxType,o=e.originalType,l=e.parentName,p=s(e,["components","mdxType","originalType","parentName"]),u=c(n),h=i,m=u["".concat(l,".").concat(h)]||u[h]||d[h]||o;return n?r.createElement(m,a(a({ref:t},p),{},{components:n})):r.createElement(m,a({ref:t},p))}));function m(e,t){var n=arguments,i=t&&t.mdxType;if("string"==typeof e||i){var o=n.length,a=new Array(o);a[0]=h;var s={};for(var l in t)hasOwnProperty.call(t,l)&&(s[l]=t[l]);s.originalType=e,s[u]="string"==typeof e?e:i,a[1]=s;for(var c=2;c<o;c++)a[c]=n[c];return r.createElement.apply(null,a)}return r.createElement.apply(null,n)}h.displayName="MDXCreateElement"},1851:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>l,contentTitle:()=>a,default:()=>d,frontMatter:()=>o,metadata:()=>s,toc:()=>c});var r=n(7462),i=(n(7294),n(3905));const o={},a="Quick Start",s={unversionedId:"introduction/quick-start",id:"introduction/quick-start",title:"Quick Start",description:"Background",source:"@site/docs/01_introduction/02_quick-start.md",sourceDirName:"01_introduction",slug:"/introduction/quick-start",permalink:"/nestjs-cls/introduction/quick-start",draft:!1,editUrl:"https://github.com/Papooch/nestjs-cls/tree/main/docs/docs/01_introduction/02_quick-start.md",tags:[],version:"current",sidebarPosition:2,frontMatter:{},sidebar:"documentationSidebar",previous:{title:"Installation",permalink:"/nestjs-cls/introduction/installation"},next:{title:"How it works",permalink:"/nestjs-cls/introduction/how-it-works"}},l={},c=[{value:"Background",id:"background",level:2},{value:"Example",id:"example",level:2},{value:"Register the ClsModule",id:"register-the-clsmodule",level:3},{value:"Create IP-address interceptor",id:"create-ip-address-interceptor",level:3},{value:"Mount interceptor to controller",id:"mount-interceptor-to-controller",level:3},{value:"Access CLS context in service",id:"access-cls-context-in-service",level:3},{value:"That&#39;s it",id:"thats-it",level:3}],p={toc:c},u="wrapper";function d(e){let{components:t,...n}=e;return(0,i.kt)(u,(0,r.Z)({},p,n,{components:t,mdxType:"MDXLayout"}),(0,i.kt)("h1",{id:"quick-start"},"Quick Start"),(0,i.kt)("h2",{id:"background"},"Background"),(0,i.kt)("p",null,"This library exposes a dynamic ",(0,i.kt)("inlineCode",{parentName:"p"},"ClsModule")," which exposes the injectable ",(0,i.kt)("inlineCode",{parentName:"p"},"ClsService")," and provides means to setting up and interacting with the CLS context."),(0,i.kt)("p",null,"The CLS context is a storage that wraps around a chain of function calls. It can be accessed anywhere during the lifecycle of such chain via the ",(0,i.kt)("inlineCode",{parentName:"p"},"ClsService"),"."),(0,i.kt)("h2",{id:"example"},"Example"),(0,i.kt)("p",null,"Below is an example of using this library to store the client's IP address in an interceptor and retrieving it in a service without explicitly passing it along."),(0,i.kt)("admonition",{type:"note"},(0,i.kt)("p",{parentName:"admonition"},"This example assumes you are using HTTP and therefore can use middleware. For usage with non-HTTP transports, see ",(0,i.kt)("a",{parentName:"p",href:"/nestjs-cls/setting-up-cls-context/"},"Setting up CLS context"),".")),(0,i.kt)("h3",{id:"register-the-clsmodule"},"Register the ClsModule"),(0,i.kt)("p",null,"Register the ",(0,i.kt)("inlineCode",{parentName:"p"},"ClsModule")," and automatically mount the ",(0,i.kt)("inlineCode",{parentName:"p"},"ClsMiddleware")," which wraps the entire request in a shared CLS context on all routes."),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-ts",metastring:'title="app.module.ts"',title:'"app.module.ts"'},"@Module({\n    imports: [\n        // highlight-start\n        ClsModule.forRoot({\n            global: true,\n            middleware: { mount: true },\n        }),\n        // highlight-end\n    ],\n    providers: [AppService],\n    controllers: [AppController],\n})\nexport class AppModule {}\n")),(0,i.kt)("h3",{id:"create-ip-address-interceptor"},"Create IP-address interceptor"),(0,i.kt)("p",null,"Create an interceptor that"),(0,i.kt)("ul",null,(0,i.kt)("li",{parentName:"ul"},"injects the ",(0,i.kt)("inlineCode",{parentName:"li"},"ClsService")," to get access to the current shared CLS context,"),(0,i.kt)("li",{parentName:"ul"},"extract the users's IP address from the request and stores it into the CLS context,")),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-ts",metastring:'title="user-ip.interceptor.ts"',title:'"user-ip.interceptor.ts"'},"@Injectable()\nexport class UserIpInterceptor implements NestInterceptor {\n    // highlight-start\n    constructor(private readonly cls: ClsService) {}\n    // highlight-end\n\n    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {\n        const request = context.switchToHttp().getRequest();\n        const userIp = request.connection.remoteAddress;\n        // highlight-start\n        this.cls.set('ip', userIp);\n        // highlight-end\n        return next.handle();\n    }\n}\n")),(0,i.kt)("h3",{id:"mount-interceptor-to-controller"},"Mount interceptor to controller"),(0,i.kt)("p",null,"By mounting the ",(0,i.kt)("inlineCode",{parentName:"p"},"UserIpInterceptor")," on the controller, it gets access to the same shared CLS context that the ",(0,i.kt)("inlineCode",{parentName:"p"},"ClsMiddleware")," set up."),(0,i.kt)("p",null,"Of course, we could also bind the interceptor globally with ",(0,i.kt)("inlineCode",{parentName:"p"},"APP_INTERCEPTOR"),"."),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-ts",metastring:'title="app.controller.ts"',title:'"app.controller.ts"'},"// highlight-start\n@UseInterceptors(UserIpInterceptor)\n// highlight-end\n@Injectable()\nexport class AppController {\n    constructor(private readonly appService: AppService) {}\n\n    @Get('/hello')\n    hello() {\n        return this.appService.sayHello();\n    }\n}\n")),(0,i.kt)("h3",{id:"access-cls-context-in-service"},"Access CLS context in service"),(0,i.kt)("p",null,"In the ",(0,i.kt)("inlineCode",{parentName:"p"},"AppService"),", we can retrieve the user's IP from the CLS context without explicitly passing in anything, and without making the ",(0,i.kt)("inlineCode",{parentName:"p"},"AppService")," request-scoped!"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-ts",metastring:'title="app.service.ts"',title:'"app.service.ts"'},"@Injectable()\nexport class AppService {\n    // highlight-start\n    constructor(private readonly cls: ClsService) {}\n    // highlight-end\n\n    sayHello() {\n        // highlight-start\n        const userIp = this.cls.get('ip');\n        // highlight-end\n        return 'Hello ' + userIp + '!';\n    }\n}\n")),(0,i.kt)("h3",{id:"thats-it"},"That's it"),(0,i.kt)("p",null,"This is pretty much all there is to it. This library further further provides more quality-of-life features, so read on!"),(0,i.kt)("admonition",{type:"info"},(0,i.kt)("p",{parentName:"admonition"},"If your use-case is really simple, you can instead consider ",(0,i.kt)("a",{parentName:"p",href:"https://docs.nestjs.com/recipes/async-local-storage#custom-implementation"},"creating a custom implementation with ",(0,i.kt)("inlineCode",{parentName:"a"},"AsyncLocalStorage")),". Limiting the number of dependencies in your application is always a good idea!")))}d.isMDXComponent=!0}}]);