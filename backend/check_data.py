import urllib.request, json

# ---- HYDERABAD ----
data = json.loads(urllib.request.urlopen('http://127.0.0.1:8000/api/stats/dashboard?city=hyderabad&limit_alerts=50').read())
alerts = data['alerts']
fleet = data['fleet']

print("=" * 80)
print("HYD FLEET")
print("=" * 80)
for b in fleet:
    print(f"  {b['bus_label']} | {b['route_id']} | lat={b['current_lat']} lng={b['current_lng']}")

print()
print("=" * 80)
print(f"HYD ALERTS ({len(alerts)} total)")
print("=" * 80)

# Check if alerts have valid lat/lng
no_lat = [a for a in alerts if a['latitude'] is None or a['longitude'] is None]
print(f"  Alerts with NULL coords: {len(no_lat)}")

# Group by type
from collections import Counter
types = Counter(a['alert_type'] for a in alerts)
print(f"  Types: {dict(types)}")

print()
print("  Checking route alignment (lat/lng vs route coords):")
# Hyderabad Route 216 bounding box: lat 17.41-17.46, lng 78.34-78.39
# Hyderabad Route 10H bounding box: lat 17.39-17.44, lng 78.44-78.50
# Hyderabad Route 5K bounding box: lat 17.36-17.38, lng 78.47-78.55

for a in alerts:
    lat, lng = a['latitude'], a['longitude']
    bus_id = a.get('bus_id', '?')
    route = a.get('route_id', '?')
    typ = a['alert_type']
    code = a['alert_code']
    if lat and lng:
        # Validate in-bounds for city
        in_hyd = 17.30 <= lat <= 17.55 and 78.30 <= lng <= 78.60
        print(f"  {code:15s} | {typ:25s} | {bus_id} | lat={lat:.4f} lng={lng:.4f} | inHyd={'OK' if in_hyd else 'BAD!'}")

# ---- PUNE ----
print()
data2 = json.loads(urllib.request.urlopen('http://127.0.0.1:8000/api/stats/dashboard?city=pune&limit_alerts=50').read())
alerts2 = data2['alerts']
fleet2 = data2['fleet']

print("=" * 80)
print("PUNE FLEET")
print("=" * 80)
for b in fleet2:
    print(f"  {b['bus_label']} | {b['route_id']} | lat={b['current_lat']} lng={b['current_lng']}")

print()
print("=" * 80)
print(f"PUNE ALERTS ({len(alerts2)} total)")
print("=" * 80)
no_lat2 = [a for a in alerts2 if a['latitude'] is None or a['longitude'] is None]
print(f"  Alerts with NULL coords: {len(no_lat2)}")

types2 = Counter(a['alert_type'] for a in alerts2)
print(f"  Types: {dict(types2)}")

print()
print("  Checking route alignment:")
for a in alerts2:
    lat, lng = a['latitude'], a['longitude']
    bus_id = a.get('bus_id', '?')
    typ = a['alert_type']
    code = a['alert_code']
    if lat and lng:
        in_pune = 18.40 <= lat <= 18.65 and 73.70 <= lng <= 74.00
        print(f"  {code:15s} | {typ:25s} | {bus_id} | lat={lat:.4f} lng={lng:.4f} | inPune={'OK' if in_pune else 'BAD!'}")

print()
print("=== DONE ===")
