"use strict";(self.webpackChunknestjs_cls_docs=self.webpackChunknestjs_cls_docs||[]).push([[6437],{880:(e,n,r)=>{r.r(n),r.d(n,{assets:()=>l,contentTitle:()=>i,default:()=>h,frontMatter:()=>o,metadata:()=>c,toc:()=>a});var s=r(4246),t=r(1670);const o={},i="Proxy Providers",c={id:"features-and-use-cases/proxy-providers",title:"Proxy Providers",description:"Since v3.0",source:"@site/docs/03_features-and-use-cases/06_proxy-providers.md",sourceDirName:"03_features-and-use-cases",slug:"/features-and-use-cases/proxy-providers",permalink:"/nestjs-cls/features-and-use-cases/proxy-providers",draft:!1,unlisted:!1,editUrl:"https://github.com/Papooch/nestjs-cls/tree/main/docs/docs/03_features-and-use-cases/06_proxy-providers.md",tags:[],version:"current",sidebarPosition:6,frontMatter:{},sidebar:"documentationSidebar",previous:{title:"Type safety and type inference",permalink:"/nestjs-cls/features-and-use-cases/type-safety-and-type-inference"},next:{title:"API",permalink:"/nestjs-cls/api/"}},l={},a=[{value:"Class Proxy Providers",id:"class-proxy-providers",level:2},{value:"Populate in an enhancer",id:"populate-in-an-enhancer",level:3},{value:"Self-populating Proxy Provider",id:"self-populating-proxy-provider",level:3},{value:"Factory Proxy Providers",id:"factory-proxy-providers",level:2},{value:"Delayed resolution of Proxy Providers",id:"delayed-resolution-of-proxy-providers",level:2},{value:"Outside web request",id:"outside-web-request",level:3},{value:"With cls.run()",id:"with-clsrun",level:4},{value:"With @UseCls()",id:"with-usecls",level:4},{value:"Selective resolution of Proxy Providers",id:"selective-resolution-of-proxy-providers",level:3},{value:"Strict Proxy Providers",id:"strict-proxy-providers",level:2},{value:"Caveats",id:"caveats",level:2},{value:"No primitive values",id:"no-primitive-values",level:3},{value:"<code>function</code> Proxies must be explicitly enabled",id:"function-proxies-must-be-explicitly-enabled",level:3},{value:"Limited support for injecting Proxy Providers into each other",id:"limited-support-for-injecting-proxy-providers-into-each-other",level:3}];function d(e){const n={a:"a",admonition:"admonition",blockquote:"blockquote",code:"code",em:"em",h1:"h1",h2:"h2",h3:"h3",h4:"h4",p:"p",pre:"pre",...(0,t.a)(),...e.components};return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(n.h1,{id:"proxy-providers",children:"Proxy Providers"}),"\n",(0,s.jsxs)(n.blockquote,{children:["\n",(0,s.jsxs)(n.p,{children:["Since ",(0,s.jsx)(n.code,{children:"v3.0"})]}),"\n"]}),"\n",(0,s.jsxs)(n.p,{children:["This feature was inspired by how REQUEST-scoped providers (",(0,s.jsx)(n.em,{children:'"beans"'}),") work in the Spring framework for Java/Kotlin."]}),"\n",(0,s.jsxs)(n.p,{children:["Using this technique, NestJS does not need to re-create a whole DI-subtree on each request (which has ",(0,s.jsx)(n.a,{href:"https://docs.nestjs.com/fundamentals/injection-scopes#scope-hierarchy",children:"certain implications which disallows the use of REQUEST-scoped providers in certain situations"}),")."]}),"\n",(0,s.jsxs)(n.p,{children:["Rather, it injects a ",(0,s.jsx)(n.em,{children:"SINGLETON"})," ",(0,s.jsx)(n.a,{href:"https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy",children:"Proxy"})," instance, which delegates access and calls to the actual instance, which is created for each request when the CLS context is set up."]}),"\n",(0,s.jsxs)(n.p,{children:["There are two kinds of Proxy providers - ",(0,s.jsx)(n.a,{href:"#class-proxy-providers",children:(0,s.jsx)(n.em,{children:"Class"})})," and ",(0,s.jsx)(n.a,{href:"#factory-proxy-providers",children:(0,s.jsx)(n.em,{children:"Factory"})}),"."]}),"\n",(0,s.jsx)(n.admonition,{type:"note",children:(0,s.jsxs)(n.p,{children:["Please note that there are ",(0,s.jsx)(n.a,{href:"#caveats",children:(0,s.jsx)(n.em,{children:"some caveats"})})," to using this technique."]})}),"\n",(0,s.jsx)(n.h2,{id:"class-proxy-providers",children:"Class Proxy Providers"}),"\n",(0,s.jsxs)(n.p,{children:["These providers look like your regular class providers, with the exception that is the ",(0,s.jsx)(n.code,{children:"@InjectableProxy()"})," decorator to make them easily distinguishable."]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-ts",metastring:"title=user.proxy.ts",children:"// highlight-start\n@InjectableProxy()\n// highlight-end\nexport class User {\n    id: number;\n    role: string;\n}\n"})}),"\n",(0,s.jsxs)(n.p,{children:["To register the proxy provider, use the ",(0,s.jsx)(n.code,{children:"ClsModule.forFeature()"})," registration,\nwhich exposes it an injectable provider in the parent module."]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-ts",children:"ClsModule.forFeature(User);\n"})}),"\n",(0,s.jsx)(n.p,{children:"It can be then injected using the class name."}),"\n",(0,s.jsxs)(n.p,{children:["However, what will be actually injected ",(0,s.jsx)(n.em,{children:"is not"})," the instance of the class, but rather the Proxy which redirects all access to an unique instance stored in the CLS context."]}),"\n",(0,s.jsx)(n.h3,{id:"populate-in-an-enhancer",children:"Populate in an enhancer"}),"\n",(0,s.jsx)(n.p,{children:"A Class provider defined in this way will be empty upon creation, so we must assign context values to it somewhere. One place to do it is an interceptor"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-ts",metastring:"title=user.interceptor.ts",children:"@Injectable()\nexport class UserInterceptor implements NestInterceptor {\n    // we can inject the proxy here\n    // highlight-start\n    constructor(private readonly user: User) {}\n    // highlight-end\n\n    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {\n        const request = context.switchToHttp().getRequest();\n\n        // and assign or change values as it was a normal object\n        // highlight-start\n        this.user.id = request.user.id;\n        this.user.role = 'admin';\n        // highlight-end\n\n        return next.handle();\n    }\n}\n"})}),"\n",(0,s.jsx)(n.h3,{id:"self-populating-proxy-provider",children:"Self-populating Proxy Provider"}),"\n",(0,s.jsx)(n.p,{children:"It is also possible to inject other providers into the Proxy Provider to avoid having to do this in a separate component."}),"\n",(0,s.jsxs)(n.p,{children:["For the convenience, the ",(0,s.jsx)(n.code,{children:"CLS_REQ"})," and ",(0,s.jsx)(n.code,{children:"CLS_RES"})," (if enabled) and ",(0,s.jsx)(n.code,{children:"CLS_CTX"})," (when an enhancer is used) are also made into Proxy Providers and are exported from the ",(0,s.jsx)(n.code,{children:"ClsModule"}),"."]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-ts",metastring:"title=user-with-rile.proxy.ts",children:"@InjectableProxy()\nexport class UserWithRole {\n    id: number;\n    role: string;\n\n    constructor(\n        // highlight-start\n        @Inject(CLS_REQ) request: Request,\n        // highlight-end\n        roleService: RoleService,\n    ) {\n        this.id = request.user.id;\n        this.role = roleService.getForId(request.user.id);\n    }\n}\n"})}),"\n",(0,s.jsxs)(n.p,{children:["If you need to inject a provider from an external module, use the ",(0,s.jsx)(n.code,{children:"ClsModule.forFeatureAsync()"})," registration to import the containing module."]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-ts",children:"ClsModule.forFeatureAsync({\n    // make RoleService available to the Proxy provider\n    import: [RoleModule],\n    useClass: UserWithRole,\n});\n"})}),"\n",(0,s.jsxs)(n.admonition,{type:"tip",children:[(0,s.jsxs)(n.p,{children:["Using ",(0,s.jsx)(n.code,{children:"@Inject(CLS_REQ)"}),", you can entirely replace ",(0,s.jsx)(n.code,{children:"@Inject(REQUEST)"})," in REQUEST-SCOPED providers to turn them into CLS-enabled singletons without changing the implementation."]}),(0,s.jsxs)(n.p,{children:["Also ",(0,s.jsx)(n.code,{children:"@INJECT(CLS_CTX)"})," can be used to replace ",(0,s.jsx)(n.code,{children:"@Inject(CONTEXT)"}),"."]})]}),"\n",(0,s.jsx)(n.h2,{id:"factory-proxy-providers",children:"Factory Proxy Providers"}),"\n",(0,s.jsx)(n.p,{children:"Like your normal factory providers, Proxy factory providers look familiar."}),"\n",(0,s.jsxs)(n.p,{children:["They can be only registered using the ",(0,s.jsx)(n.code,{children:"ClsModule.forFeatureAsync()"})," method."]}),"\n",(0,s.jsx)(n.p,{children:"Here's an example of a hypothetical factory provider that dynamically resolves to a specific tenant database connection:"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-ts",children:"ClsModule.forFeatureAsync({\n    provide: TENANT_CONNECTION,\n    import: [DatabaseConnectionModule],\n    inject: [CLS_REQ, DatabaseConnectionService],\n    useFactory: async (req: Request, dbService: DatabaseConnectionService) => {\n        const tenantId = req.params['tenantId'];\n        const connection = await dbService.getTenantConnection(tenantId);\n        return connection;\n    },\n    global: true, // make the TENANT_CONNECTION available for injection globally\n});\n"})}),"\n",(0,s.jsxs)(n.p,{children:["Again, the factory will be called on each request and the result will be stored in the CLS context. The ",(0,s.jsx)(n.code,{children:"TENANT_CONNECTION"})," provider, however, will still be a singleton and will not affect the scope of whatever it is injected into."]}),"\n",(0,s.jsxs)(n.p,{children:["In the service, it can be injected using the ",(0,s.jsx)(n.code,{children:"provide"})," token as usual:"]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-ts",metastring:"title=dogs.service.ts",children:"@Injectable()\nclass DogsService {\n    constructor(\n        @Inject(TENANT_CONNECTION)\n        private readonly connection: TenantConnection,\n    ) {}\n\n    getAll() {\n        return this.connection.dogs.getAll();\n    }\n}\n"})}),"\n",(0,s.jsx)(n.h2,{id:"delayed-resolution-of-proxy-providers",children:"Delayed resolution of Proxy Providers"}),"\n",(0,s.jsxs)(n.p,{children:["By default, proxy providers are resolved as soon as the ",(0,s.jsx)(n.code,{children:"setup"})," function in an enhancer (middleware/guard/interceptor) finishes. For some use cases, it might be required that the resolution is delayed until some later point in the request lifecycle once more information is present in the CLS ."]}),"\n",(0,s.jsxs)(n.p,{children:["To achieve that, set ",(0,s.jsx)(n.code,{children:"resolveProxyProviders"})," to ",(0,s.jsx)(n.code,{children:"false"})," in the enhancer options and call (and await) ",(0,s.jsx)(n.code,{children:"ClsService#resolveProxyProviders()"})," manually at any time."]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-ts",children:"ClsModule.forRoot({\n    middleware: {\n        // highlight-start\n        resolveProxyProviders: false,\n        // highlight-end\n    },\n});\n\n//... later\n\nawait this.cls.resolveProxyProviders();\n"})}),"\n",(0,s.jsx)(n.h3,{id:"outside-web-request",children:"Outside web request"}),"\n",(0,s.jsxs)(n.p,{children:["This might also be necessary ",(0,s.jsx)(n.a,{href:"/nestjs-cls/features-and-use-cases/usage-outside-of-web-request",children:"outside the context of web request"}),"."]}),"\n",(0,s.jsx)(n.h4,{id:"with-clsrun",children:"With cls.run()"}),"\n",(0,s.jsxs)(n.p,{children:["If you set up the context with ",(0,s.jsx)(n.code,{children:"cls.run()"})," to wrap any subsequent code thar relies on Proxy Providers, you ",(0,s.jsx)(n.em,{children:"must"})," call ",(0,s.jsx)(n.code,{children:"ClsService#resolveProxyProviders()"})," before accessing them, otherwise access to any property of the injected Proxy Provider will return ",(0,s.jsx)(n.code,{children:"undefined"}),", that is because an unresolved Proxy Provider falls back to an ",(0,s.jsx)(n.em,{children:"empty object"}),"."]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-ts",metastring:"title=cron.controller.ts",children:"@Injectable()\nexport class CronController {\n    constructor(\n        private readonly someService: SomeService,\n        private readonly cls: ClsService,\n    );\n\n    @Cron('45 * * * * *')\n    async handleCron() {\n        await this.cls.run(async () => {\n            // prepare the context\n            this.cls.set('some-key', 'some-value');\n            // highlight-start\n            // trigger Proxy Provider resolution\n            await this.cls.resolveProxyProviders();\n            // highlight-end\n            await this.someService.doTheThing();\n        });\n    }\n}\n"})}),"\n",(0,s.jsx)(n.h4,{id:"with-usecls",children:"With @UseCls()"}),"\n",(0,s.jsxs)(n.p,{children:["Since the ",(0,s.jsx)(n.code,{children:"@UseCls()"})," decorator wraps the function body with ",(0,s.jsx)(n.code,{children:"cls.run()"})," automatically, you can use the ",(0,s.jsx)(n.code,{children:"setup"})," function to prepare the context."]}),"\n",(0,s.jsxs)(n.p,{children:["The Proxy Providers will be resolved after the ",(0,s.jsx)(n.code,{children:"setup"})," phase."]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-ts",metastring:"title=cron.controller.ts",children:"@Injectable()\nexport class CronController {\n    constructor(private readonly someService: SomeService);\n\n    @Cron('45 * * * * *')\n    @UseCls({\n        // highlight-start\n        setup: (cls) => {\n            cls.set('some-key', 'some-value');\n        },\n        // highlight-end\n    })\n    async handleCron() {\n        await this.someService.doTheThing();\n    }\n}\n"})}),"\n",(0,s.jsx)(n.h3,{id:"selective-resolution-of-proxy-providers",children:"Selective resolution of Proxy Providers"}),"\n",(0,s.jsxs)(n.p,{children:["You can also selectively resolve a subset of Proxy Providers, by passing a list of their injection tokens to ",(0,s.jsx)(n.code,{children:"ClsService#resolveProxyProviders(tokens)"}),". This is useful if the providers need to be resolved in a specific order or when some part of the application does not need all of them."]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-ts",children:"// resolves ProviderA and ProviderB only\nawait this.cls.resolveProxyProviders([ProviderA, ProviderB]);\n\n// ... later\n\n// resolves the rest of the providers that have not been resolved yet\nawait this.cls.resolveProxyProviders();\n"})}),"\n",(0,s.jsx)(n.h2,{id:"strict-proxy-providers",children:"Strict Proxy Providers"}),"\n",(0,s.jsxs)("small",{children:["since ",(0,s.jsx)(n.code,{children:"v4.4.0"})]}),"\n",(0,s.jsxs)(n.p,{children:["By default, accessing an unresolved Proxy Provider behaves as if it was an ",(0,s.jsx)(n.em,{children:"empty object"}),". In order to prevent silent failures, you can set the ",(0,s.jsx)(n.code,{children:"strict"})," option to ",(0,s.jsx)(n.code,{children:"true"})," in the proxy provider registration. In this case, any attempt to access a property or a method on an unresolved Proxy Provider will throw an error."]}),"\n",(0,s.jsxs)(n.p,{children:["For Class Proxy Providers, you can use the according option on the ",(0,s.jsx)(n.code,{children:"@InjectableProxy()"})," decorator."]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-ts",metastring:"title=user.proxy.ts",children:"@InjectableProxy({\n    // highlight-start\n    strict: true,\n    // highlight-end\n})\nexport class User {\n    id: number;\n    role: string;\n}\n"})}),"\n",(0,s.jsxs)(n.p,{children:["In case of Factory Proxy Providers, use the option on the ",(0,s.jsx)(n.code,{children:"ClsModule.forFeatureAsync()"})," registration."]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-ts",children:"ClsModule.forFeatureAsync({\n    provide: TENANT_CONNECTION,\n    import: [DatabaseConnectionModule],\n    inject: [CLS_REQ],\n    useFactory: async (req: Request) => {\n        // ... some implementation\n    },\n    // highlight-start\n    strict: true,\n    // highlight-end\n});\n"})}),"\n",(0,s.jsx)(n.h2,{id:"caveats",children:"Caveats"}),"\n",(0,s.jsx)(n.h3,{id:"no-primitive-values",children:"No primitive values"}),"\n",(0,s.jsxs)(n.p,{children:["Proxy Factory providers ",(0,s.jsx)(n.em,{children:"cannot"})," return a ",(0,s.jsx)(n.em,{children:"primitive value"}),". This is because the provider itself is the Proxy and it only delegates access once a property or a method is called on it (or if it itself is called in case the factory returns a function)."]}),"\n",(0,s.jsxs)(n.h3,{id:"function-proxies-must-be-explicitly-enabled",children:[(0,s.jsx)(n.code,{children:"function"})," Proxies must be explicitly enabled"]}),"\n",(0,s.jsxs)(n.p,{children:["In order to support injecting proxies of ",(0,s.jsx)(n.em,{children:"functions"}),", the underlying proxy ",(0,s.jsx)(n.em,{children:"target"}),' must be a function, too, in order to be able to implement the "apply" trap. However, this information cannot be extracted from the factory function itself, so if your factory returns a function, you must explicitly set the ',(0,s.jsx)(n.code,{children:"type"})," property to ",(0,s.jsx)(n.code,{children:"function"})," in the provider definition."]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-ts",children:"{\n    provide: SOME_FUNCTION,\n    useFactory: () => {\n        return () => {\n            // do something\n        };\n    },\n    // highlight-start\n    type: 'function',\n    // highlight-end\n}\n"})}),"\n",(0,s.jsx)(n.admonition,{type:"note",children:(0,s.jsxs)(n.p,{children:["In versions prior to ",(0,s.jsx)(n.code,{children:"v4.0"}),", calling ",(0,s.jsx)(n.code,{children:"typeof"})," on an instance of a Proxy provider always returned ",(0,s.jsx)(n.code,{children:"function"}),", regardless of the value it holds. This is no longer the case. Please see ",(0,s.jsx)(n.a,{href:"https://github.com/Papooch/nestjs-cls/issues/82",children:"Issue #82"})]})}),"\n",(0,s.jsx)(n.h3,{id:"limited-support-for-injecting-proxy-providers-into-each-other",children:"Limited support for injecting Proxy Providers into each other"}),"\n",(0,s.jsxs)(n.p,{children:["Apart from the built-in ",(0,s.jsx)(n.code,{children:"CLS_REQ"})," and ",(0,s.jsx)(n.code,{children:"CLS_RES"})," and ",(0,s.jsx)(n.code,{children:"CLS_CTX"})," proxy providers, custom Proxy Providers cannot be ",(0,s.jsx)(n.em,{children:"reliably"})," injected into other Proxy Providers, because there is no system in place to resolve them in the correct order (as far as Nest is concerned, all of them have already been bootstrapped, so it can't help us here), so it may happen, that during the proxy provider resolution phase, a Proxy Provider that is injected into another Proxy Provider is not yet resolved and falls back to an empty object."]}),"\n",(0,s.jsxs)(n.p,{children:["There is an open ",(0,s.jsx)(n.a,{href:"https://github.com/Papooch/nestjs-cls/issues/169",children:"feature request"})," to address this shortcoming, but until then, refer to the manual ",(0,s.jsx)(n.a,{href:"#selective-resolution-of-proxy-providers",children:"Selective resolution of Proxy Providers"})," technique. You can also leverage the ",(0,s.jsx)(n.a,{href:"#strict-proxy-providers",children:"strict"})," mode to find out which Proxy Providers are not yet resolved."]})]})}function h(e={}){const{wrapper:n}={...(0,t.a)(),...e.components};return n?(0,s.jsx)(n,{...e,children:(0,s.jsx)(d,{...e})}):d(e)}},1670:(e,n,r)=>{r.d(n,{Z:()=>c,a:()=>i});var s=r(7378);const t={},o=s.createContext(t);function i(e){const n=s.useContext(o);return s.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function c(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(t):e.components||t:i(e.components),s.createElement(o.Provider,{value:n},e.children)}}}]);