"use strict";(self.webpackChunknestjs_cls_docs=self.webpackChunknestjs_cls_docs||[]).push([[8126],{5388:(e,t,s)=>{s.r(t),s.d(t,{assets:()=>o,contentTitle:()=>l,default:()=>a,frontMatter:()=>r,metadata:()=>c,toc:()=>d});var n=s(4246),i=s(1670);const r={},l="Compatibility",c={id:"considerations/compatibility",title:"Compatibility",description:"The table below outlines the compatibility with some platforms:",source:"@site/docs/05_considerations/02_compatibility.md",sourceDirName:"05_considerations",slug:"/considerations/compatibility",permalink:"/nestjs-cls/considerations/compatibility",draft:!1,unlisted:!1,editUrl:"https://github.com/Papooch/nestjs-cls/tree/main/docs/docs/05_considerations/02_compatibility.md",tags:[],version:"current",sidebarPosition:2,frontMatter:{},sidebar:"documentationSidebar",previous:{title:"Security",permalink:"/nestjs-cls/considerations/security"},next:{title:"For library authors",permalink:"/nestjs-cls/considerations/for-library-authors"}},o={},d=[{value:"REST",id:"rest",level:2},{value:"GraphQL",id:"graphql",level:2},{value:"<code>@nestjs/graphql &gt;= 10</code>",id:"nestjsgraphql--10",level:3},{value:"<code>@nestjs/graphql &lt; 10</code>",id:"nestjsgraphql--10-1",level:3},{value:"Others",id:"others",level:2},{value:"Websockets",id:"websockets",level:3}];function h(e){const t={a:"a",blockquote:"blockquote",code:"code",em:"em",h1:"h1",h2:"h2",h3:"h3",li:"li",p:"p",pre:"pre",strong:"strong",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",ul:"ul",...(0,i.a)(),...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(t.h1,{id:"compatibility",children:"Compatibility"}),"\n",(0,n.jsx)(t.p,{children:"The table below outlines the compatibility with some platforms:"}),"\n",(0,n.jsxs)(t.table,{children:[(0,n.jsx)(t.thead,{children:(0,n.jsxs)(t.tr,{children:[(0,n.jsx)(t.th,{style:{textAlign:"center"}}),(0,n.jsx)(t.th,{style:{textAlign:"center"},children:"REST"}),(0,n.jsx)(t.th,{style:{textAlign:"center"},children:"GQL"}),(0,n.jsxs)(t.th,{style:{textAlign:"center"},children:["WS",(0,n.jsx)(t.a,{href:"#websockets",children:"*"})]}),(0,n.jsx)(t.th,{style:{textAlign:"center"},children:"Microservices"})]})}),(0,n.jsxs)(t.tbody,{children:[(0,n.jsxs)(t.tr,{children:[(0,n.jsx)(t.td,{style:{textAlign:"center"},children:(0,n.jsx)(t.strong,{children:"ClsMiddleware"})}),(0,n.jsx)(t.td,{style:{textAlign:"center"},children:"\u2714"}),(0,n.jsx)(t.td,{style:{textAlign:"center"},children:"\u2714"}),(0,n.jsx)(t.td,{style:{textAlign:"center"},children:"\u2716"}),(0,n.jsx)(t.td,{style:{textAlign:"center"},children:"\u2716"})]}),(0,n.jsxs)(t.tr,{children:[(0,n.jsxs)(t.td,{style:{textAlign:"center"},children:[(0,n.jsx)(t.strong,{children:"ClsGuard"})," ",(0,n.jsx)("br",{}),"(uses ",(0,n.jsx)(t.code,{children:"enterWith"}),")"]}),(0,n.jsx)(t.td,{style:{textAlign:"center"},children:"\u2714"}),(0,n.jsx)(t.td,{style:{textAlign:"center"},children:"\u2714"}),(0,n.jsx)(t.td,{style:{textAlign:"center"},children:"\u2714"}),(0,n.jsx)(t.td,{style:{textAlign:"center"},children:"\u2714"})]}),(0,n.jsxs)(t.tr,{children:[(0,n.jsxs)(t.td,{style:{textAlign:"center"},children:[(0,n.jsx)(t.strong,{children:"ClsInterceptor"})," ",(0,n.jsx)("br",{}),"(context inaccessible",(0,n.jsx)("br",{}),"in ",(0,n.jsx)(t.em,{children:"Guards"})," and",(0,n.jsx)("br",{})," in ",(0,n.jsx)(t.em,{children:"Exception Filters"}),")"]}),(0,n.jsx)(t.td,{style:{textAlign:"center"},children:"\u2714"}),(0,n.jsx)(t.td,{style:{textAlign:"center"},children:"\u2714"}),(0,n.jsx)(t.td,{style:{textAlign:"center"},children:"\u2714"}),(0,n.jsx)(t.td,{style:{textAlign:"center"},children:"\u2714"})]})]})]}),"\n",(0,n.jsx)(t.h2,{id:"rest",children:"REST"}),"\n",(0,n.jsxs)(t.p,{children:["This package is compatible with Nest-supported REST controllers and the preferred way is to use the ",(0,n.jsx)(t.code,{children:"ClsMiddleware"})," with the ",(0,n.jsx)(t.code,{children:"mount"})," option set to ",(0,n.jsx)(t.code,{children:"true"}),"."]}),"\n",(0,n.jsx)(t.p,{children:"Tested with:"}),"\n",(0,n.jsxs)(t.ul,{children:["\n",(0,n.jsx)(t.li,{children:"\u2714 Express"}),"\n",(0,n.jsx)(t.li,{children:"\u2714 Fastify"}),"\n"]}),"\n",(0,n.jsx)(t.p,{children:"Known issues:"}),"\n",(0,n.jsxs)(t.ul,{children:["\n",(0,n.jsxs)(t.li,{children:["In case API versioning is used, the automatic mounting of the ",(0,n.jsx)(t.code,{children:"ClsMiddleware"})," does not work and it needs to be mounted manually. See issue ",(0,n.jsx)(t.a,{href:"https://github.com/Papooch/nestjs-cls/issues/67",children:"#67"})," for details."]}),"\n",(0,n.jsxs)(t.li,{children:["Some existing Express middlewares may cause context loss, if that happens, mount the ",(0,n.jsx)(t.code,{children:"ClsMiddleware"})," manually ",(0,n.jsx)(t.em,{children:"after"})," those offending ones (",(0,n.jsx)(t.a,{href:"https://github.com/Papooch/nestjs-cls/issues/50#issuecomment-1368162870",children:"#50"}),")"]}),"\n"]}),"\n",(0,n.jsx)(t.h2,{id:"graphql",children:"GraphQL"}),"\n",(0,n.jsx)(t.p,{children:"Using an interceptor or a guard may result in that enhancer triggering multiple times in case there are multiple queries in the GQL request."}),"\n",(0,n.jsxs)(t.p,{children:["Due to this, you should ensure that any operation on the CLS store within enhancers is ",(0,n.jsx)(t.em,{children:"idempotent"}),". This includes the ",(0,n.jsx)(t.code,{children:"setup"})," function. Therefore, it is advised to use the ",(0,n.jsx)(t.code,{children:"ClsService#setIfUndefined()"})," method."]}),"\n",(0,n.jsx)(t.p,{children:"Tested with:"}),"\n",(0,n.jsxs)(t.ul,{children:["\n",(0,n.jsx)(t.li,{children:"\u2714 Apollo (Express)"}),"\n",(0,n.jsx)(t.li,{children:"\u2714 Mercurius (Fastify)"}),"\n"]}),"\n",(0,n.jsx)(t.h3,{id:"nestjsgraphql--10",children:(0,n.jsx)(t.code,{children:"@nestjs/graphql >= 10"})}),"\n",(0,n.jsxs)(t.p,{children:["Since v10, Nest's GraphQL resolvers are compatible with this package and the preferred way to initialize the CLS context is use the ",(0,n.jsx)(t.code,{children:"ClsMiddleware"})," with the ",(0,n.jsx)(t.code,{children:"mount"})," option."]}),"\n",(0,n.jsx)(t.h3,{id:"nestjsgraphql--10-1",children:(0,n.jsx)(t.code,{children:"@nestjs/graphql < 10"})}),"\n",(0,n.jsxs)(t.p,{children:["For older versions of graphql, the ",(0,n.jsx)(t.code,{children:"ClsMiddleware"})," needs to be ",(0,n.jsx)(t.a,{href:"/nestjs-cls/setting-up-cls-context/using-a-middleware#manually",children:"mounted manually"})," with ",(0,n.jsx)(t.code,{children:"app.use(...)"})," in order to correctly set up the context for resolvers. Additionally, you have to pass ",(0,n.jsx)(t.code,{children:"useEnterWith: true"})," to the ",(0,n.jsx)(t.code,{children:"ClsMiddleware"})," options, because the context gets lost otherwise due to ",(0,n.jsx)(t.a,{href:"https://github.com/apollographql/apollo-server/issues/2042",children:"an issue with CLS and Apollo"})," (sadly, the same is true for ",(0,n.jsx)(t.a,{href:"https://github.com/Papooch/nestjs-cls/issues/1",children:"Mercurius"}),"). This method is functionally identical to just using the ",(0,n.jsx)(t.code,{children:"ClsGuard"}),"."]}),"\n",(0,n.jsxs)(t.p,{children:["Alternatively, you can use the ",(0,n.jsx)(t.code,{children:"ClsInterceptor"}),", which uses the safer ",(0,n.jsx)(t.code,{children:"AsyncLocalStorage#run"})," (thanks to ",(0,n.jsx)(t.a,{href:"https://github.com/Papooch/nestjs-cls/issues/5",children:"andreialecu"}),"), but remember that using it makes CLS unavailable in ",(0,n.jsx)(t.em,{children:"Guards"}),"."]}),"\n",(0,n.jsx)(t.h2,{id:"others",children:"Others"}),"\n",(0,n.jsxs)(t.p,{children:["Use the ",(0,n.jsx)(t.code,{children:"ClsGuard"})," or ",(0,n.jsx)(t.code,{children:"ClsInterceptor"})," to set up context with any other platform."]}),"\n",(0,n.jsx)(t.p,{children:"There are no explicit test for other transports, so I can't guarantee it will work with your platform of choice, but there's nothing that would indicate otherwise."}),"\n",(0,n.jsxs)(t.blockquote,{children:["\n",(0,n.jsxs)(t.p,{children:["If you decide to try this package with a platform that is not listed here, ",(0,n.jsx)(t.strong,{children:"please let me know"})," so I can add the compatibility notice."]}),"\n"]}),"\n",(0,n.jsx)(t.p,{children:"Below are listed transports with which it is confirmed to work:"}),"\n",(0,n.jsx)(t.h3,{id:"websockets",children:"Websockets"}),"\n",(0,n.jsxs)(t.p,{children:[(0,n.jsx)(t.em,{children:"Websocket Gateways"})," don't respect globally bound enhancers, therefore it is required to bind the ",(0,n.jsx)(t.code,{children:"ClsGuard"})," or ",(0,n.jsx)(t.code,{children:"ClsInterceptor"})," manually on the ",(0,n.jsx)(t.code,{children:"WebsocketGateway"}),". Special care is also needed for the ",(0,n.jsx)(t.code,{children:"handleConnection"})," method (See ",(0,n.jsx)(t.a,{href:"https://github.com/Papooch/nestjs-cls/issues/8",children:"#8"}),")"]}),"\n",(0,n.jsx)(t.pre,{children:(0,n.jsx)(t.code,{className:"language-ts",children:"@WebSocketGateway()\n// highlight-start\n@UseInterceptors(ClsInterceptor)\n// highlight-end\nexport class Gateway {\n    // ...\n}\n"})})]})}function a(e={}){const{wrapper:t}={...(0,i.a)(),...e.components};return t?(0,n.jsx)(t,{...e,children:(0,n.jsx)(h,{...e})}):h(e)}},1670:(e,t,s)=>{s.d(t,{Z:()=>c,a:()=>l});var n=s(7378);const i={},r=n.createContext(i);function l(e){const t=n.useContext(r);return n.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function c(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:l(e.components),n.createElement(r.Provider,{value:t},e.children)}}}]);