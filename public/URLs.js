/*
 * If not stated otherwise in this file or this component's license file the
 * following copyright and licenses apply:
 *
 * Copyright 2018 RDK Management
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var urls = [
  {
    name: "PlutoTV",
    url:
      "https://service-stitcher.clusters.pluto.tv/stitch/hls/channel/564b9ed65fbbbca07e8d09d2/master.m3u8?deviceType=comcastx1&deviceMake=comcastx1&deviceModel=comcastx1&sid=dea085c8-2861-4388-8f06-65798057dbed&deviceId=2d55be90-9751-11e9-8fbe-73d0eeed6c94&deviceVersion=na&appVersion=2.3.2-842fe713&deviceDNT=0&userId=&advertisingId=na&deviceLat=34.0675&deviceLon=-118.3521&app_name=&appName=comcastx1&buildVersion=&appStoreUrl=&architecture=&serverSideAds=true",
    useComcastDrmConfig: false,
  },
  {
    name: "Sintel Subtitle",
    url:
      "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    useComcastDrmConfig: true,
  },
  {
    name: "Big Buck Bunny (CLEAR)",
    url:
      "http://amssamples.streaming.mediaservices.windows.net/683f7e47-bd83-4427-b0a3-26a6c4547782/BigBuckBunny.ism/manifest(format=mpd-time-csf)",
    useComcastDrmConfig: false,
  },
  {
    name: "Deadpool (HLS)",
    url:
      "http://ccr.ipvod-t6.xcr.comcast.net/ipvod4/PFXM3033039820190601/movie/1558895446379/manifest.m3u8",
    useComcastDrmConfig: true,
  },
  {
    name: "Godzilla (HLS)",
    url:
      "http://ccr.ipvod-t6.xcr.comcast.net/ipvod1/TVNC0000000002950377/movie/1556381264464/manifest.m3u8",
    useComcastDrmConfig: true,
  },
];
