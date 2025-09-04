/// <reference types="vite/client" />
/// <reference types="angular" />
/// <reference types="tampermonkey" />

declare var angular: angular.IAngularStatic | undefined;

declare global {
  interface Function {
    $inject?: readonly string[] | undefined;
  }
}
