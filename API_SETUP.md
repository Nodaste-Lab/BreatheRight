# API Setup Instructions

## 🔑 Required API Keys

To use real air quality and pollen data, you need to obtain API keys from weather services.

### OpenWeatherMap (Required for AQI data)

1. **Sign up**: Go to https://openweathermap.org/api
2. **Create account**: Free tier includes 1,000 calls/day
3. **Get API key**: Go to API keys section in your account
4. **Add to environment**: Add to your `.env.local` file:

```env
EXPO_PUBLIC_OPENWEATHER_API_KEY=your_actual_api_key_here
```

### Optional: Tomorrow.io (For better pollen data)

1. **Sign up**: Go to https://www.tomorrow.io/
2. **Free tier**: 1,000 calls/day with comprehensive pollen data
3. **Get API key**: From your dashboard
4. **Add to environment**:

```env
EXPO_PUBLIC_TOMORROW_IO_API_KEY=your_tomorrow_io_api_key
```

## 🚀 Current Implementation Status

### ✅ Working Features

**AQI Data (OpenWeatherMap Air Pollution API)**:
- Real-time air quality index (1-5 scale converted to 0-500)
- All major pollutants: PM2.5, PM10, Ozone, NO2, SO2, CO
- Automatic fallback to mock data if API fails
- Error handling and retry logic

**Pollen Data (Seasonal Estimation Model)**:
- Location and season-based estimation
- Tree, grass, and weed pollen levels
- Hemisphere-aware seasonal adjustments
- Fallback data for offline use

### 🔄 Fallback System

The app gracefully handles API failures:
- **No internet**: Uses cached/fallback data
- **API key missing**: Shows estimation model data
- **API rate limits**: Falls back to mock data
- **Invalid responses**: Uses safe default values

## 🧪 Testing the Integration

### With OpenWeatherMap API Key:

1. **Add API key** to `.env.local`:
```env
EXPO_PUBLIC_OPENWEATHER_API_KEY=your_key_here
```

2. **Restart the app**:
```bash
# Kill current server
# Restart with: npm start
```

3. **Test locations**:
   - Add a location (GPS or address)
   - Check console for API calls
   - Verify real AQI data loads
   - Compare with mock data behavior

### Without API Key:

1. **Fallback behavior**: App uses estimation models
2. **No errors**: Graceful degradation to mock data
3. **User experience**: Still functional for testing

## 📊 Data Sources & Accuracy

### AQI Data (OpenWeatherMap)
- **Coverage**: Global
- **Update frequency**: Hourly
- **Accuracy**: Based on satellite and ground station data
- **Pollutants**: CO, NO, NO2, O3, SO2, PM2.5, PM10, NH3

### Pollen Data (Current: Estimation Model)
- **Coverage**: Global with seasonal patterns
- **Accuracy**: Simplified estimation based on location/season
- **Types**: Tree, grass, weed pollen
- **Improvement**: Can be upgraded to real pollen APIs

## 🔮 Production Upgrades

### For Full Production:

1. **Better Pollen API**: Integrate Tomorrow.io or AccuWeather
```typescript
// Example Tomorrow.io integration provided in pollen.ts
export async function fetchTomorrowIoPollenData(lat: number, lon: number)
```

2. **Caching Layer**: Add Redis/local storage for API response caching
3. **Rate Limiting**: Implement request batching for multiple locations
4. **Historical Data**: Add historical AQI/pollen trends
5. **Forecasting**: 5-day air quality and pollen forecasts

### Cost Optimization:

- **Free Tiers**: OpenWeatherMap (1K calls/day) + Tomorrow.io (1K calls/day) 
- **Request Batching**: Cache data for 1-hour intervals
- **Smart Updates**: Only refresh when user actively views location
- **Estimated Cost**: $0-50/month for moderate usage

## 🐛 Troubleshooting

### Common Issues:

1. **"API key not configured"**: Add `EXPO_PUBLIC_OPENWEATHER_API_KEY` to `.env.local`
2. **"403 Forbidden"**: Check API key is valid and active
3. **"Network error"**: Check internet connection, API might be down
4. **Fallback data showing**: Normal behavior when API unavailable

### Debug Steps:

1. **Check environment**: Verify `.env.local` has correct API key
2. **Check console**: Look for API error messages
3. **Test API directly**: 
   ```bash
   curl "https://api.openweathermap.org/data/2.5/air_pollution?lat=35&lon=139&appid=YOUR_API_KEY"
   ```

## 📈 Monitoring & Analytics

### Production Monitoring:
- Track API response times
- Monitor API error rates  
- Alert on quota limits
- Log failed location lookups

### User Analytics:
- Most viewed locations
- Feature usage patterns
- API performance impact on UX

---

*Ready to test with real data! Add your OpenWeatherMap API key and restart the app.* 🌍