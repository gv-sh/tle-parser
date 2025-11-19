# Angular Service for TLE Parser

Angular service wrapper for TLE (Two-Line Element) satellite data parsing and tracking using RxJS observables.

## Installation

```bash
npm install tle-parser
```

## Setup

Import the service in your module or use it directly with standalone components:

```typescript
import { TLEService } from './tle.service';

@NgModule({
  providers: [TLEService]
})
export class AppModule { }
```

Or with standalone components:

```typescript
import { TLEService } from './tle.service';

@Component({
  standalone: true,
  providers: [TLEService]
})
export class MyComponent { }
```

## Usage Examples

### Basic TLE Parsing

```typescript
import { Component, OnInit } from '@angular/core';
import { TLEService, TLEState } from './tle.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-tle-parser',
  template: `
    <div *ngIf="tleState$ | async as state">
      <button (click)="parseTLE()" [disabled]="state.loading">
        {{ state.loading ? 'Parsing...' : 'Parse TLE' }}
      </button>

      <div *ngIf="state.error" class="error">
        Error: {{ state.error.message }}
      </div>

      <div *ngIf="state.data" class="result">
        <h3>{{ state.data.satelliteName }}</h3>
        <p>Satellite Number: {{ state.data.satelliteNumber }}</p>
        <p>Inclination: {{ state.data.inclination }}°</p>
        <p>Mean Motion: {{ state.data.meanMotion }} rev/day</p>
      </div>
    </div>
  `
})
export class TLEParserComponent implements OnInit {
  tleState$: Observable<TLEState>;

  constructor(private tleService: TLEService) {
    this.tleState$ = this.tleService.getTLEState();
  }

  ngOnInit() {}

  parseTLE() {
    const line1 = "1 25544U 98067A   21001.00000000  .00002182  00000-0  41420-4 0  9990";
    const line2 = "2 25544  51.6461 339.8014 0002571  34.5857 120.4689 15.48919393265018";
    const line0 = "ISS (ZARYA)";

    this.tleService.parse(line1, line2, line0).subscribe({
      next: (data) => console.log('TLE parsed:', data),
      error: (error) => console.error('Parse error:', error)
    });
  }
}
```

### Real-Time Satellite Tracking

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { TLEService, SatelliteTrackingState } from './tle.service';
import { Observable, Subscription } from 'rxjs';
import { ParsedTLE } from 'tle-parser';

@Component({
  selector: 'app-satellite-tracker',
  template: `
    <div *ngIf="trackingState$ | async as state">
      <h2>Satellite Tracker</h2>

      <button (click)="startTracking()">Start Tracking</button>
      <button (click)="stopTracking()">Stop Tracking</button>

      <div *ngIf="state.error">{{ state.error.message }}</div>

      <div *ngIf="state.position" class="position">
        <h3>Current Position</h3>
        <p>Latitude: {{ state.position.latitude.toFixed(4) }}°</p>
        <p>Longitude: {{ state.position.longitude.toFixed(4) }}°</p>
        <p>Altitude: {{ state.position.altitude.toFixed(2) }} km</p>
        <p>Velocity: {{ state.position.velocity.toFixed(2) }} km/s</p>
      </div>

      <div *ngIf="state.lookAngles" class="look-angles">
        <h3>Look Angles</h3>
        <p>Azimuth: {{ state.lookAngles.azimuth.toFixed(2) }}°</p>
        <p>Elevation: {{ state.lookAngles.elevation.toFixed(2) }}°</p>
        <p>Range: {{ state.lookAngles.range.toFixed(2) }} km</p>
        <p [class.visible]="state.isVisible" [class.not-visible]="!state.isVisible">
          {{ state.isVisible ? '✅ Visible' : '❌ Below Horizon' }}
        </p>
      </div>
    </div>
  `,
  styles: [`
    .visible { color: green; }
    .not-visible { color: red; }
  `]
})
export class SatelliteTrackerComponent implements OnInit, OnDestroy {
  trackingState$: Observable<SatelliteTrackingState> | null = null;
  private trackingSubscription?: Subscription;
  private tleData: ParsedTLE | null = null;

  constructor(private tleService: TLEService) {}

  ngOnInit() {
    // Parse TLE first
    const line1 = "1 25544U 98067A   21001.00000000  .00002182  00000-0  41420-4 0  9990";
    const line2 = "2 25544  51.6461 339.8014 0002571  34.5857 120.4689 15.48919393265018";

    this.tleService.parse(line1, line2, "ISS").subscribe({
      next: (data) => this.tleData = data
    });
  }

  startTracking() {
    if (!this.tleData) return;

    const groundLocation = {
      latitude: 40.7128,
      longitude: -74.0060,
      altitude: 0
    };

    this.trackingState$ = this.tleService.trackSatellite(
      this.tleData,
      1000,
      groundLocation
    );

    this.trackingSubscription = this.trackingState$.subscribe();
  }

  stopTracking() {
    this.trackingSubscription?.unsubscribe();
  }

  ngOnDestroy() {
    this.trackingSubscription?.unsubscribe();
  }
}
```

### Fetching TLE Data

```typescript
import { Component, OnInit } from '@angular/core';
import { TLEService } from './tle.service';
import { ParsedTLE } from 'tle-parser';

@Component({
  selector: 'app-tle-fetch',
  template: `
    <div>
      <button (click)="fetchISS()" [disabled]="loading">
        {{ loading ? 'Loading...' : 'Fetch ISS TLE' }}
      </button>

      <div *ngFor="let tle of tleData">
        <h4>{{ tle.satelliteName }}</h4>
        <p>Satellite #: {{ tle.satelliteNumber }}</p>
        <p>Epoch: {{ tle.epochDate | date:'medium' }}</p>
      </div>
    </div>
  `
})
export class TLEFetchComponent {
  tleData: ParsedTLE[] = [];
  loading = false;

  constructor(private tleService: TLEService) {}

  fetchISS() {
    this.loading = true;
    this.tleService.fetch('celestrak', {
      group: 'stations',
      satellites: ['ISS']
    }).subscribe({
      next: (data) => {
        this.tleData = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Fetch error:', error);
        this.loading = false;
      }
    });
  }
}
```

### Visibility Windows

```typescript
import { Component, OnInit } from '@angular/core';
import { TLEService } from './tle.service';
import { VisibilityWindow, ParsedTLE } from 'tle-parser';

@Component({
  selector: 'app-visibility-windows',
  template: `
    <div>
      <h2>Visibility Windows (Next 7 Days)</h2>
      <button (click)="calculate()">Calculate</button>

      <table *ngIf="windows.length > 0">
        <thead>
          <tr>
            <th>Pass</th>
            <th>Rise</th>
            <th>Set</th>
            <th>Max Elevation</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let window of windows; let i = index">
            <td>{{ i + 1 }}</td>
            <td>{{ window.rise | date:'short' }}</td>
            <td>{{ window.set | date:'short' }}</td>
            <td>{{ window.maxElevation.toFixed(2) }}°</td>
            <td>{{ getDuration(window) }} min</td>
          </tr>
        </tbody>
      </table>
    </div>
  `
})
export class VisibilityWindowsComponent implements OnInit {
  windows: VisibilityWindow[] = [];
  private tleData: ParsedTLE | null = null;

  constructor(private tleService: TLEService) {}

  ngOnInit() {
    // Parse TLE first
    const line1 = "1 25544U 98067A   21001.00000000  .00002182  00000-0  41420-4 0  9990";
    const line2 = "2 25544  51.6461 339.8014 0002571  34.5857 120.4689 15.48919393265018";

    this.tleService.parse(line1, line2, "ISS").subscribe({
      next: (data) => this.tleData = data
    });
  }

  calculate() {
    if (!this.tleData) return;

    const groundLocation = {
      latitude: 40.7128,
      longitude: -74.0060,
      altitude: 0
    };

    this.tleService.calculateVisibilityWindows(
      this.tleData,
      groundLocation,
      new Date(),
      7
    ).subscribe({
      next: (windows) => this.windows = windows
    });
  }

  getDuration(window: VisibilityWindow): number {
    return ((window.set.getTime() - window.rise.getTime()) / 60000);
  }
}
```

## Complete Example: ISS Tracker

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { TLEService, SatelliteTrackingState } from './tle.service';
import { Observable, Subscription } from 'rxjs';
import { ParsedTLE, VisibilityWindow } from 'tle-parser';

@Component({
  selector: 'app-iss-tracker',
  template: `
    <div class="iss-tracker">
      <h1>🛰️ ISS Tracker</h1>

      <section>
        <h2>Real-Time Position</h2>
        <button (click)="toggleTracking()">
          {{ (trackingState$ | async)?.isTracking ? 'Stop' : 'Start' }} Tracking
        </button>

        <div *ngIf="trackingState$ | async as state">
          <div *ngIf="state.position" class="position-info">
            <p><strong>Latitude:</strong> {{ state.position.latitude.toFixed(4) }}°</p>
            <p><strong>Longitude:</strong> {{ state.position.longitude.toFixed(4) }}°</p>
            <p><strong>Altitude:</strong> {{ state.position.altitude.toFixed(2) }} km</p>
          </div>

          <div *ngIf="state.lookAngles">
            <h3>From Your Location</h3>
            <p><strong>Azimuth:</strong> {{ state.lookAngles.azimuth.toFixed(2) }}°</p>
            <p><strong>Elevation:</strong> {{ state.lookAngles.elevation.toFixed(2) }}°</p>
            <p>{{ state.isVisible ? '✅ Visible' : '❌ Below Horizon' }}</p>
          </div>
        </div>
      </section>

      <section *ngIf="windows.length > 0">
        <h2>Upcoming Passes</h2>
        <table>
          <tr *ngFor="let window of windows">
            <td>{{ window.rise | date:'short' }}</td>
            <td>{{ window.set | date:'short' }}</td>
            <td>{{ window.maxElevation.toFixed(1) }}°</td>
          </tr>
        </table>
      </section>
    </div>
  `
})
export class ISSTrackerComponent implements OnInit, OnDestroy {
  trackingState$: Observable<SatelliteTrackingState> | null = null;
  windows: VisibilityWindow[] = [];
  private tleData: ParsedTLE | null = null;
  private subscription?: Subscription;

  constructor(private tleService: TLEService) {}

  ngOnInit() {
    this.tleService.fetch('celestrak', {
      group: 'stations',
      satellites: ['ISS']
    }).subscribe({
      next: (data) => {
        this.tleData = data[0];
        this.calculateVisibilityWindows();
      }
    });
  }

  toggleTracking() {
    if (!this.tleData) return;

    if (this.subscription) {
      this.subscription.unsubscribe();
      this.trackingState$ = null;
    } else {
      const location = { latitude: 40.7128, longitude: -74.0060, altitude: 0 };
      this.trackingState$ = this.tleService.trackSatellite(this.tleData, 1000, location);
      this.subscription = this.trackingState$.subscribe();
    }
  }

  calculateVisibilityWindows() {
    if (!this.tleData) return;

    const location = { latitude: 40.7128, longitude: -74.0060, altitude: 0 };
    this.tleService.calculateVisibilityWindows(this.tleData, location).subscribe({
      next: (windows) => this.windows = windows
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }
}
```

## License

MIT
