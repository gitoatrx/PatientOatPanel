# 🔍 Doctor Stream Debug Guide

## How to Debug if Doctor's Stream is Coming to Patient

### **Step 1: Open Patient URL and Check Console** 📱

1. **Open the patient URL**: `http://localhost:3000/patient/telehealth/[token]/[appointmentId]`
2. **Open Developer Tools** (F12)
3. **Go to Console tab**
4. **Click "Join Call"** and watch the console logs

### **Step 2: Look for These Key Log Sequences** 🔍

#### **✅ Expected Log Sequence (Success):**

```
🔴 About to connect to session: { sessionId: "...", applicationId: "..." }
🔴 Session connect callback called: { error: null, connectionId: "..." }
🔴 SESSION CONNECTED: { connectionId: "...", sessionId: "..." }
🔴 About to publish local stream: { publisher: {...}, hasVideo: true }
🔴 Publish callback called: { error: null, streamId: "..." }
✅ Successfully published local stream: { streamId: "...", hasVideo: true }

// When doctor joins:
🔴 NEW CONNECTION CREATED (Doctor joined): { connectionId: "doctor123", isOwnConnection: false }
🔴 STREAM CREATED EVENT RECEIVED: { streamId: "stream456", connectionId: "doctor123", isOwnStream: false }
remote stream detected: { streamId: "stream456", hasVideo: true }
remote stream container appended: { streamId: "stream456" }
remote stream subscribed: { streamId: "stream456" }
```

#### **❌ Problem Scenarios:**

**Scenario A: No Doctor Connection**
```
🔴 SESSION CONNECTED: { connectionId: "patient123" }
// ❌ NO "NEW CONNECTION CREATED" log = Doctor never joined
```

**Scenario B: Doctor Joined but No Stream**
```
🔴 NEW CONNECTION CREATED (Doctor joined): { connectionId: "doctor123" }
// ❌ NO "STREAM CREATED EVENT" = Doctor joined but didn't publish stream
```

**Scenario C: Stream Created but Subscription Failed**
```
🔴 STREAM CREATED EVENT RECEIVED: { streamId: "stream456" }
remote stream detected: { streamId: "stream456" }
// ❌ NO "remote stream subscribed" = Subscription failed
```

### **Step 3: Use Debug Buttons** 🛠️

After joining the call, use these debug buttons in the UI:

#### **Button 1: 👥 Print Participants**
- **What it does**: Shows all connected participants
- **Look for**: Should show 2 participants when doctor joins
- **Expected output**:
```
🔍 PARTICIPANTS DEBUG:
Total participants: 2
Participant 1: { connectionId: "patient123", isLocal: true, hasVideo: true }
Participant 2: { connectionId: "doctor123", isLocal: false, hasVideo: true }
```

#### **Button 2: 🔍 Check Existing Streams**
- **What it does**: Manually scans for existing streams in session
- **Look for**: Should find doctor's stream if it exists
- **Expected output**:
```
🔍 MANUALLY CHECKING EXISTING STREAMS...
Total existing streams: 2
Stream 1: { streamId: "patient_stream", isOwn: true }
Stream 2: { streamId: "doctor_stream", isOwn: false, shouldSubscribe: true }
```

#### **Button 3: ✅ Debug Publisher State**
- **What it does**: Shows complete publisher and session state
- **Look for**: Publisher should have video enabled
- **Expected output**:
```
🔍 PUBLISHER DEBUG STATE:
publisherExists: true
publisherHasVideo: true
publisherHasAudio: true
sessionExists: true
isConnected: true
isVideoEnabled: true
```

#### **Button 4: 💬 Debug Session Connections** (NEW)
- **What it does**: Shows all connections and streams in the session
- **Look for**: Should show 2 connections and 2 streams
- **Expected output**:
```
🔍 SESSION CONNECTIONS DEBUG:
connectionsCount: 2
streamsCount: 2
Connection 1: { connectionId: "patient123", isOwn: true }
Connection 2: { connectionId: "doctor123", isOwn: false }
Stream 1: { streamId: "patient_stream", isOwn: true, hasVideo: true }
Stream 2: { streamId: "doctor_stream", isOwn: false, hasVideo: true }
```

### **Step 4: Diagnose the Issue** 🔬

Based on the console logs, identify the problem:

#### **🚨 Issue 1: Doctor Never Joins**
**Symptoms:**
- No `🔴 NEW CONNECTION CREATED` log
- `connectionsCount: 1` in debug
- Only patient connection visible

**Causes:**
- Doctor not clicking "Start Call"
- Doctor has connection issues
- Different session IDs
- Token issues on doctor side

**Solution:**
- Check doctor's console for errors
- Verify both are using same session
- Check doctor's network connection

#### **🚨 Issue 2: Doctor Joins but No Stream**
**Symptoms:**
- `🔴 NEW CONNECTION CREATED` appears
- No `🔴 STREAM CREATED EVENT` log
- `streamsCount: 1` in debug (only patient stream)

**Causes:**
- Doctor's camera permissions denied
- Doctor's publish failed
- Doctor's camera disabled
- Doctor's network issues

**Solution:**
- Check doctor's console for publish errors
- Verify doctor's camera permissions
- Check doctor's camera toggle state

#### **🚨 Issue 3: Stream Created but Subscription Failed**
**Symptoms:**
- `🔴 STREAM CREATED EVENT` appears
- No `remote stream subscribed` log
- Stream exists but not visible

**Causes:**
- Subscription error
- DOM container issues
- Network issues during subscription

**Solution:**
- Check for subscription error logs
- Verify remote container exists
- Check network connectivity

#### **🚨 Issue 4: Stream Subscribed but Not Visible**
**Symptoms:**
- All logs show success
- Stream subscribed successfully
- But video tile is blank

**Causes:**
- Video element not rendering
- CSS/styling issues
- Browser compatibility
- Video codec issues

**Solution:**
- Check DOM for video elements
- Verify CSS styling
- Test in different browser
- Check video codec support

### **Step 5: Real-time Monitoring** 📊

#### **Monitor These Events in Real-time:**

1. **Connection Events:**
   - `connectionCreated` - Doctor joins
   - `connectionDestroyed` - Doctor leaves

2. **Stream Events:**
   - `streamCreated` - Doctor publishes stream
   - `streamDestroyed` - Doctor stops stream

3. **Session Events:**
   - `sessionConnected` - Patient connects
   - `sessionDisconnected` - Patient disconnects

#### **Watch for State Changes:**
- `isConnected` - Should be `true` when connected
- `participantCount` - Should be `2` when doctor joins
- `isVideoEnabled` - Should be `true` for video
- `callStatus` - Should be `CONNECTED` when both joined

### **Step 6: Common Debug Commands** 💻

#### **In Browser Console:**
```javascript
// Check session state
console.log('Session:', window.telehealth?.session);

// Check connections
console.log('Connections:', window.telehealth?.session?.connections);

// Check streams
console.log('Streams:', window.telehealth?.session?.streams);

// Check publisher
console.log('Publisher:', window.telehealth?.publisher);
```

#### **Network Tab:**
- Check for failed API calls
- Verify WebRTC connections
- Look for 404s or timeouts

### **Step 7: Quick Fixes** ⚡

#### **If No Doctor Connection:**
1. Refresh both patient and doctor pages
2. Check if doctor clicked "Start Call"
3. Verify same session ID
4. Check network connectivity

#### **If Doctor Stream Missing:**
1. Check doctor's camera permissions
2. Verify doctor's camera is enabled
3. Check doctor's console for errors
4. Try different browser

#### **If Subscription Fails:**
1. Check for subscription errors in console
2. Verify remote container exists
3. Try manual stream check button
4. Refresh and retry

### **Step 8: Success Indicators** ✅

**You'll know it's working when you see:**
- ✅ 2 connections in session
- ✅ 2 streams in session  
- ✅ `remote stream subscribed` log
- ✅ Video tile shows doctor's video
- ✅ Participant count shows 2
- ✅ Status shows "Connected"

---

## 🎯 **Quick Debug Checklist**

- [ ] Patient joins successfully
- [ ] Doctor joins successfully (`NEW CONNECTION CREATED`)
- [ ] Doctor publishes stream (`STREAM CREATED EVENT`)
- [ ] Patient subscribes to stream (`remote stream subscribed`)
- [ ] Video tile shows doctor's video
- [ ] Participant count shows 2
- [ ] No error logs in console

**If any step fails, use the debug buttons and check the specific error logs!** 🚀
