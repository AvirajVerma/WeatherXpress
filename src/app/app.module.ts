import { AutoCompleteComponent } from './components/autocomplete.component';
import { WeatherDetailComponent } from './components/weather/weather-detail.component';
import { SideBarDirective } from './directives/sidebar.directive';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { ServiceWorkerModule } from '@angular/service-worker';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { environment } from '../environments/environment';
import { CityDetailComponent } from './components/city-detail.component';
import { WeatherComponent } from './components/weather/weather.component';
import { CityComponent } from './components/cities.component';
import { ModalComponent } from './components/modal/modal.component';


@NgModule({
  declarations: [
    AppComponent,
    WeatherComponent,
    CityComponent,
    CityDetailComponent,
    SideBarDirective,
    WeatherDetailComponent,
    AutoCompleteComponent,
    ModalComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
