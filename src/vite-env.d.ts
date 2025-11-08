/// <reference types="vite/client" />
/// <reference types="angular" />
/// <reference types="tampermonkey" />
/// <reference types="jquery" />

declare interface JQuery {
  foundation(method: string, ...options: any[]): JQuery;
}

declare interface Window {
  angular: angular.IAngularStatic | undefined;
  $: JQueryStatic | undefined;
  jQuery: JQueryStatic | undefined;
}

// declare global {
//   interface Function {
//     $inject?: readonly string[] | undefined;
//   }
// }
