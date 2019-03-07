import { identity, of } from 'rxjs';
import { flatMap, map } from 'rxjs/operators';
import { Calls$ } from '../blockchain/calls/calls';

export function pluginDevModeHelpers(theCalls$: Calls$) {
  theCalls$.pipe(
    map(call => {
      (window as any).removeProxy = () => {
        call.proxyAddress().pipe(
          flatMap(proxyAddress => {
            if (!proxyAddress) {
              console.log('Proxy not found!');
              return of();
            }
            console.log('proxyAddress:', proxyAddress);
            return call.setOwner({
               proxyAddress,
               ownerAddress: '0x0000000000000000000000000000000000000000'
             });
          })
        ).subscribe(identity);
      };
      (window as any).disapproveProxy = (token: string) => {
        call.proxyAddress().pipe(
          flatMap(proxyAddress => {
            if (!proxyAddress) {
              console.log('Proxy not found!');
              return of();
            }
            console.log('proxyAddress:', proxyAddress);
            return call.disapproveProxy({ proxyAddress, token });
          })
        ).subscribe(identity);
      };
      console.log('Dev mode helpers installed!');
    })
  ).subscribe(identity);
}
