import { Observable } from 'rxjs/index';

export type ObservableItem<T> = T extends Observable<infer U> ? U : never;
