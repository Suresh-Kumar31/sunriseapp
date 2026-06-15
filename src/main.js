import { createApp } from 'vue'
import { Geolocation } from '@capacitor/geolocation'
import { LocalNotifications } from '@capacitor/local-notifications'
import { getSunTimes, formatTime, formatDate } from './sun.js'
import './style.css'

const STORAGE_KEY = 'sun-alarm-settings-v1'

createApp({
  data() {
    return {
      latitude: 12.2958,
      longitude: 76.6394,
      placeName: 'My location',
      enableSunriseAlarm: true,
      enableSunsetAlarm: true,
      minutesBefore: 10,
      today: new Date(),
      message: '',
      error: '',
      permissionStatus: '',
      nextDays: []
    }
  },
  computed: {
    todaysTimes() {
      return getSunTimes(this.today, Number(this.latitude), Number(this.longitude))
    }
  },
  mounted() {
    this.loadSettings()
    this.refreshDays()
    setInterval(() => {
      this.today = new Date()
      this.refreshDays()
    }, 60 * 1000)
  },
  methods: {
    loadSettings() {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) Object.assign(this, JSON.parse(raw))
    },
    saveSettings() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        latitude: Number(this.latitude),
        longitude: Number(this.longitude),
        placeName: this.placeName,
        enableSunriseAlarm: this.enableSunriseAlarm,
        enableSunsetAlarm: this.enableSunsetAlarm,
        minutesBefore: Number(this.minutesBefore)
      }))
      this.refreshDays()
      this.message = 'Settings saved.'
    },
    async useGps() {
      this.error = ''
      this.message = 'Getting GPS location...'
      try {
        const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 15000 })
        this.latitude = Number(pos.coords.latitude.toFixed(6))
        this.longitude = Number(pos.coords.longitude.toFixed(6))
        this.placeName = 'GPS location'
        this.saveSettings()
        this.message = 'GPS location saved.'
      } catch (e) {
        this.error = 'Could not get GPS location. Enter latitude/longitude manually.'
        this.message = ''
      }
    },
    refreshDays() {
      const rows = []
      for (let i = 0; i < 7; i++) {
        const d = new Date()
        d.setDate(d.getDate() + i)
        const times = getSunTimes(d, Number(this.latitude), Number(this.longitude))
        rows.push({ date: d, sunrise: times.sunrise, sunset: times.sunset })
      }
      this.nextDays = rows
    },
    alarmDate(eventDate) {
      if (!eventDate) return null
      return new Date(eventDate.getTime() - Number(this.minutesBefore) * 60000)
    },
    async requestNotificationPermission() {
      const result = await LocalNotifications.requestPermissions()
      this.permissionStatus = result.display || result.receive || 'unknown'
      return result.display === 'granted'
    },
    async scheduleAlarms() {
      this.error = ''
      this.message = ''
      try {
        const ok = await this.requestNotificationPermission()
        if (!ok) {
          this.error = 'Notification permission was not granted.'
          return
        }

        await LocalNotifications.cancel({ notifications: Array.from({ length: 30 }, (_, i) => ({ id: i + 1 })) })

        const notifications = []
        let id = 1
        for (let i = 0; i < 7; i++) {
          const d = new Date()
          d.setDate(d.getDate() + i)
          const { sunrise, sunset } = getSunTimes(d, Number(this.latitude), Number(this.longitude))
          const items = [
            { enabled: this.enableSunriseAlarm, label: 'Sunrise', date: sunrise },
            { enabled: this.enableSunsetAlarm, label: 'Sunset', date: sunset }
          ]
          for (const item of items) {
            const at = this.alarmDate(item.date)
            if (item.enabled && at && at > new Date()) {
              notifications.push({
                id: id++,
                title: `${item.label} in ${this.minutesBefore} minutes`,
                body: `${item.label} time is ${formatTime(item.date)}`,
                schedule: { at, allowWhileIdle: true },
                sound: 'default'
              })
            }
          }
        }

        if (!notifications.length) {
          this.error = 'No future alarms found to schedule.'
          return
        }
        await LocalNotifications.schedule({ notifications })
        this.message = `Scheduled ${notifications.length} alarms for the next 7 days.`
      } catch (e) {
        this.error = e?.message || 'Could not schedule alarms.'
      }
    },
    formatTime,
    formatDate
  },
  template: `
    <main class="page">
      <section class="hero">
        <div>
          <p class="eyebrow">Offline daily sun timer</p>
          <h1>Sun Alarm</h1>
          <p class="muted">Check sunrise and sunset and schedule alarms before them.</p>
        </div>
      </section>

      <section class="card today">
        <h2>Today · {{ formatDate(today) }}</h2>
        <div class="time-grid">
          <div><span>Sunrise</span><strong>{{ formatTime(todaysTimes.sunrise) }}</strong></div>
          <div><span>Sunset</span><strong>{{ formatTime(todaysTimes.sunset) }}</strong></div>
        </div>
      </section>

      <section class="card">
        <h2>Location</h2>
        <button class="primary" @click="useGps">Use GPS location</button>
        <div class="form-grid">
          <label>Latitude<input v-model.number="latitude" type="number" step="0.000001"></label>
          <label>Longitude<input v-model.number="longitude" type="number" step="0.000001"></label>
        </div>
        <label>Place name<input v-model="placeName" type="text"></label>
        <button @click="saveSettings">Save location</button>
      </section>

      <section class="card">
        <h2>Alarm Settings</h2>
        <label class="check"><input type="checkbox" v-model="enableSunriseAlarm"> Sunrise alarm</label>
        <label class="check"><input type="checkbox" v-model="enableSunsetAlarm"> Sunset alarm</label>
        <label>Minutes before event<input v-model.number="minutesBefore" type="number" min="1" max="120"></label>
        <button class="primary" @click="scheduleAlarms">Schedule alarms</button>
      </section>

      <section class="card">
        <h2>Next 7 days</h2>
        <div class="row header"><span>Date</span><span>Sunrise</span><span>Sunset</span></div>
        <div class="row" v-for="d in nextDays" :key="d.date.toDateString()">
          <span>{{ formatDate(d.date) }}</span>
          <span>{{ formatTime(d.sunrise) }}</span>
          <span>{{ formatTime(d.sunset) }}</span>
        </div>
      </section>

      <p v-if="message" class="message">{{ message }}</p>
      <p v-if="error" class="error">{{ error }}</p>
    </main>
  `
}).mount('#app')
