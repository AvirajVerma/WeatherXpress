import { UIService } from './ui.service';
import { environment } from './../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { Observable, of, Subject, throwError } from 'rxjs';
import { PartialWeather, OneWeather, Place } from '../model/weather';
import helpers from './helpers';

@Injectable({ providedIn: 'root' })
export class WeatherService {
  APP_ID = environment.APP_ID;
  weatherUrl = environment.weatherUrl;
  currentWeatherUrl = environment.currentWeatherUrl;
  MY_API = environment.MY_API;
  POSITION_KEY = environment.POSITION_KEY;
  cityUrl = 'https://maps.googleapis.com/maps/api/place/findplacefromtext/json';
  lat = null;
  lon = null;
  geoTaken = false;
  public weatherData: OneWeather;
  // subjects
  public subject = new Subject<any>();
  public citySub = new Subject<Place>();
  public cityUpdatedSub = new Subject<Place[]>();
  public selectedCities: Place[] = [];

  constructor(public httpClient: HttpClient, public ui: UIService) {}
  // get current locations
  public getGeolocation(): void {
    if (!this.geoTaken && navigator.geolocation) {
      this.getPosition()
        .then((x) => {
          this.get(x);
        })
        .catch((e) => {
          this.get(e);
        });
    }
  }
  getPosition(): Promise<Place> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (resp) => {
          resolve({
            lon: resp.coords.longitude,
            lat: resp.coords.latitude,
            name: 'Your Location',
          });
        },
        (err) => {
          try{
            let city = this.getDefaultCity();
            if(city.lat && city.lon && city.name){
              this.get(city);
            }
          }
          catch(_){ this.ui.showModal() }
        }
      );
    });
  }
  // get weather
  get(city?: Place): void {
    this.ui.toggleLoading(true);
    this.lat = city.lat;
    this.lon = city.lon;
    const result = this.httpClient
      .get<OneWeather>(this.weatherUrl, {
        params: {
          lat: this.lat,
          lon: this.lon,
          APPID: this.APP_ID,
          units: 'metric',
          exclude: 'minutely',
        },
      })
      .pipe(
        map((x: any) => {
          x.current.dt = this.getTime(x.current.dt);
          if (this.cityAlreadyAdded(city) > -1) {
            x.added = true;
          }
          return { ...x, timezone: `${city.name}` };
        }),
        catchError(this.handleError)
      )
      .subscribe((data) => {
        this.ui.toggleLoading(false);
        this.weatherData = data;
        this.dispatchWeatherData();
      });
  }
  public dispatchWeatherData(): void {
    this.subject.next({ ...this.weatherData });
  }
  public getCurrentWeather(city: Place): Observable<PartialWeather> {
    const weather: PartialWeather = {};
    return this.httpClient
      .get<any>(this.currentWeatherUrl, {
        params: {
          lat: city.lat.toString(),
          lon: city.lon.toString(),
          APPID: this.APP_ID,
          units: 'metric',
          exclude: 'minutely',
        },
      })
      .pipe(
        map((x: any) => {
          weather.current = Math.round(x.main.temp);
          weather.max_temp = Math.round(x.main.temp_max);
          weather.min_temp = Math.round(x.main.temp_min);
          return weather;
        })
      );
  }
  getTime(unixtime?: number): { time: string; day: string; date?: string } {
    return helpers.getTime(unixtime);
  }
  parseDay(day: number): string {
    return helpers.parseDay(day);
  }
  private handleError(e: HttpErrorResponse): any {
    return throwError(e.error);
  }
  public addCity(city: Place): void {
    if (this.cityAlreadyAdded(city) === -1) {
      this.selectedCities.unshift(city);
      this.dispatchCities();
      this.setCities();
    }
  }
  private cityAlreadyAdded(city: Place): number {
    let index = -1;
    this.selectedCities.forEach((x, i) => {
      if (x.name === city.name) {
        index = i;
      }
    });
    return index;
  }
  public removeCity(city: Place): void {
    const index = this.cityAlreadyAdded(city);
    if (index > -1) {
      this.selectedCities.splice(index, 1);
      this.dispatchCities();
      this.setCities();
    }
  }
  public getCities(): void {
    const cities: Place[] = JSON.parse(localStorage.getItem('cities'));
    this.selectedCities = cities ? cities : [];
    this.dispatchCities();
  }
  public setCities(): void {
    localStorage.setItem('cities', JSON.stringify(this.selectedCities));
  }
  private dispatchCities(): void {
    this.cityUpdatedSub.next(this.selectedCities);
  }
  public setDefaultCity(name: string, lat: number, lon: number): boolean {
    const val = { name, lat, lon };
    localStorage.setItem('default', JSON.stringify(val));
    return true;
  }
  public getDefaultCity(): Place {
    return JSON.parse(localStorage.getItem('default'));
  }
}
