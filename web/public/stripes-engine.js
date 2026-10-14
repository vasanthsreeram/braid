globalThis.process??={};globalThis.process.env??={};var Zi=["always","hover"],Nh=["default","wave","constellation","comet"],el=["default","detonation","supernova","tidal","magma"];function h(e,t,a){return e<t?t:e>a?a:e}var d=(e,t)=>typeof e=="number"&&Number.isFinite(e)?e:t,tl={fit:"width",zoom:1,panX:0,panY:0};function al(e={}){return{fit:e.fit==="contain"||e.fit==="cover"||e.fit==="stretch"||e.fit==="width"||e.fit==="height"?e.fit:"width",zoom:h(d(e.zoom,1),.1,8),panX:h(d(e.panX,0),-1,1),panY:h(d(e.panY,0),-1,1)}}var Go=["topToBottom","leftToRight","rightToLeft","bottomToTop"];function xn(e){return Go.indexOf(e)}var je={direction:"topToBottom",stopCount:2,stops:[16777215,0,0,0],hueDriftDeg:0,saturationBoost:0};function Oo(e={}){let t=Array.isArray(e.stops)?e.stops:[];return{direction:Go.includes(e.direction)?e.direction:je.direction,stopCount:Math.round(h(d(e.stopCount,je.stopCount),2,4)),stops:[0,1,2,3].map(a=>Math.round(h(d(t[a],je.stops[a]),0,16777215))),hueDriftDeg:h(d(e.hueDriftDeg,je.hueDriftDeg),-180,180),saturationBoost:h(d(e.saturationBoost,je.saturationBoost),0,1)}}var zo={enabled:!1,ratePerSec:5,maxActive:36,radiantAngleDeg:35,angleJitterDeg:14,speedScale:1,speedVariation:.4,tailLengthScale:1,tailLengthVariation:.47,thicknessScale:1,thicknessVariation:.39,lifetimeMinMs:1e3,lifetimeMaxMs:2400,brightness:1,headGlow:1,pushPx:6,pushFalloffScale:1,fadeInMs:80,fadeOutMs:580,seed:1};function rl(e={}){let t=zo,a=h(d(e.lifetimeMinMs,t.lifetimeMinMs),60,2e4),r=Math.max(a,h(d(e.lifetimeMaxMs,t.lifetimeMaxMs),60,2e4));return{enabled:e.enabled===void 0?t.enabled:!!e.enabled,ratePerSec:h(d(e.ratePerSec,t.ratePerSec),.02,120),maxActive:de(d(e.maxActive,t.maxActive),1,64),radiantAngleDeg:h(d(e.radiantAngleDeg,t.radiantAngleDeg),-180,180),angleJitterDeg:h(d(e.angleJitterDeg,t.angleJitterDeg),0,90),speedScale:h(d(e.speedScale,t.speedScale),.05,6),speedVariation:h(d(e.speedVariation,t.speedVariation),0,1),tailLengthScale:h(d(e.tailLengthScale,t.tailLengthScale),.05,6),tailLengthVariation:h(d(e.tailLengthVariation,t.tailLengthVariation),0,1),thicknessScale:h(d(e.thicknessScale,t.thicknessScale),.05,6),thicknessVariation:h(d(e.thicknessVariation,t.thicknessVariation),0,1),lifetimeMinMs:a,lifetimeMaxMs:r,brightness:h(d(e.brightness,t.brightness),0,4),headGlow:h(d(e.headGlow,t.headGlow),0,4),pushPx:h(d(e.pushPx,t.pushPx),0,80),pushFalloffScale:h(d(e.pushFalloffScale,t.pushFalloffScale),.05,8),fadeInMs:h(d(e.fadeInMs,t.fadeInMs),0,1e4),fadeOutMs:h(d(e.fadeOutMs,t.fadeOutMs),0,1e4),seed:de(d(e.seed,t.seed),0,1e6)}}var ce={color:16777215,transparent:!0,gradient:{enabled:!1,...je,stops:[...je.stops]},grid:{enabled:!1,cellWidth:96,cellHeight:96,gapX:8,gapY:8,cornerRadius:0,color:15987699,opacity:1},stars:{enabled:!1,density:50,sizePx:8,sizeRandomness:.65,tiltAngleDeg:0,twinkleSpeed:1,twinkleAmount:.7,opacity:.8,color:16777215},meteors:{...zo}};function Ho(e={}){let t=e.grid??{},a=e.stars??{},r=e.gradient??{},n=h(Math.round(d(t.cellWidth,ce.grid.cellWidth)),4,512),o=h(Math.round(d(t.cellHeight,ce.grid.cellHeight)),4,512);return{color:Math.round(h(d(e.color,ce.color),0,16777215)),transparent:e.transparent===void 0?ce.transparent:!!e.transparent,gradient:{enabled:r.enabled===void 0?ce.gradient.enabled:!!r.enabled,...Oo(r)},grid:{enabled:t.enabled===void 0?ce.grid.enabled:!!t.enabled,cellWidth:n,cellHeight:o,gapX:h(d(t.gapX,ce.grid.gapX),0,n),gapY:h(d(t.gapY,ce.grid.gapY),0,o),cornerRadius:h(d(t.cornerRadius,ce.grid.cornerRadius),0,Math.max(n,o)),color:Math.round(h(d(t.color,ce.grid.color),0,16777215)),opacity:h(d(t.opacity,ce.grid.opacity),0,1)},stars:{enabled:a.enabled===void 0?ce.stars.enabled:!!a.enabled,density:h(d(a.density,ce.stars.density),0,100),sizePx:h(d(a.sizePx,ce.stars.sizePx),.25,64),sizeRandomness:h(d(a.sizeRandomness,ce.stars.sizeRandomness),0,1),tiltAngleDeg:h(d(a.tiltAngleDeg,ce.stars.tiltAngleDeg),-89,89),twinkleSpeed:h(d(a.twinkleSpeed,ce.stars.twinkleSpeed),0,10),twinkleAmount:h(d(a.twinkleAmount,ce.stars.twinkleAmount),0,1),opacity:h(d(a.opacity,ce.stars.opacity),0,1),color:Math.round(h(d(a.color,ce.stars.color),0,16777215))},meteors:rl(e.meteors)}}var nl={cellWidth:7,cellHeight:7,gapX:0,gapY:0,cornerRadius:0,orientation:"vertical",angleDeg:0,rotationMode:"cell",overlapAmount:1,streamGapWave:{enabled:!1,squeeze:0,wavelengthCells:16,speed:0,phaseDeg:0}};function ol(e={}){let t=h(Math.round(d(e.cellWidth,7)),1,64),a=h(Math.round(d(e.cellHeight,7)),1,64),r=e.orientation==="horizontal"?"horizontal":"vertical";return{cellWidth:t,cellHeight:a,gapX:h(d(e.gapX,0),0,t),gapY:h(d(e.gapY,0),0,a),cornerRadius:h(d(e.cornerRadius,0),0,Math.max(t,a)),orientation:r,angleDeg:h(d(e.angleDeg,r==="horizontal"?90:0),-180,180),rotationMode:e.rotationMode==="overlap"?"overlap":"cell",overlapAmount:h(d(e.overlapAmount,1),0,4),streamGapWave:{enabled:!!e.streamGapWave?.enabled,squeeze:h(d(e.streamGapWave?.squeeze,0),0,1),wavelengthCells:h(d(e.streamGapWave?.wavelengthCells,16),2,32),speed:h(d(e.streamGapWave?.speed,0),-10,10),phaseDeg:h(d(e.streamGapWave?.phaseDeg,0),-180,180)}}}var il={brightness:0,exposure:0,contrast:1,blackPoint:0,whitePoint:1,gamma:1,invert:!1,posterizeLevels:0,thresholdBias:0,noiseAmount:0,blurRadius:0,sharpenAmount:0};function ll(e={}){let t=h(d(e.blackPoint,0),0,1);return{brightness:h(d(e.brightness,0),-1,1),exposure:h(d(e.exposure,0),-5,5),contrast:h(d(e.contrast,1),0,4),blackPoint:t,whitePoint:h(d(e.whitePoint,1),t+.01,1),gamma:Math.max(.05,d(e.gamma,1)),invert:!!e.invert,posterizeLevels:h(Math.round(d(e.posterizeLevels,0)),0,16),thresholdBias:h(d(e.thresholdBias,0),-1,1),noiseAmount:h(d(e.noiseAmount,0),0,1),blurRadius:h(d(e.blurRadius,0),0,4),sharpenAmount:h(d(e.sharpenAmount,0),0,4)}}var Vo=[{color:15987699,startFrom:.12,width:1,opacity:1},{color:16439960,startFrom:.28,width:1,opacity:1},{color:16301424,startFrom:.44,width:2,opacity:1},{color:16162381,startFrom:.6,width:3,opacity:1},{color:15891507,startFrom:.76,width:4,opacity:1},{color:15423273,startFrom:.9,width:5,opacity:1}];function sl(e){return{color:Math.round(h(d(e.color,0),0,16777215)),startFrom:h(d(e.startFrom,0),0,1),width:h(d(e.width,1),.5,64),opacity:h(d(e.opacity,1),0,1)}}function ul(e,t){return!e||e.length===0?t.map(a=>({...a})):e.map(sl)}var Ct={intensity:1,reachScale:1,widthScale:1,displacementScale:1,particleSizeScale:1,particleSpeedScale:1,particleGravityScale:1,seed:81027},No={...Ct,durationMs:1750,fadeStart:.26,fadeEnd:.6,growthExponent:.66,particleCount:13,coreRadiusScale:1,coreBrightness:1,plasmaScale:1,turbulenceScale:1,rayStrength:1,swirlScale:1,shadeStrength:1,coronaRadiusScale:1,coronaBrightness:1},Xo={...Ct,durationMs:620,fadeStart:.32,fadeEnd:.86,growthExponent:.66,particleCount:13,maxConcurrent:4,coreRadiusScale:1,coreBrightness:1,plasmaScale:1,turbulenceScale:1,rayStrength:1,swirlScale:1,shadeStrength:1},qo={...Ct,durationMs:1850,fadeStart:.24,fadeEnd:.65,growthExponent:.82,particleCount:16,foamStrength:1,causticStrength:1,curlScale:1,flowScale:1,flowSpeedScale:1,depthShade:1,routeIrregularity:1,crestStrength:1,thinningStart:.24,thinningEnd:.67},jo={...Ct,durationMs:560,fadeStart:.3,fadeEnd:.9,growthExponent:2,particleCount:12,maxConcurrent:4,foamStrength:1,causticStrength:1,curlScale:1,flowScale:1,flowSpeedScale:1,depthShade:1,routeIrregularity:1,crestStrength:1},$o={...Ct,durationMs:1900,fadeStart:.25,fadeEnd:.64,growthExponent:.78,particleCount:7,crackCount:7,crackWidthScale:1,crackHeat:1,plateScale:1,channelWidthScale:1,crustStrength:1,swirlScale:1,coreBrightness:1,branchSpreadScale:1,churnScale:1,coreRadiusScale:1},Yo={...Ct,durationMs:590,fadeStart:.3,fadeEnd:.91,growthExponent:.72,particleCount:7,maxConcurrent:4,crackCount:7,crackWidthScale:1,crackHeat:1,plateScale:1,channelWidthScale:1,crustStrength:1,swirlScale:1,coreBrightness:1,branchSpreadScale:1,churnScale:1,coreRadiusScale:1};function Tt(e,t,a){let r=a==="reveal",n=h(d(e.fadeStart,t.fadeStart),0,.95);return{durationMs:h(d(e.durationMs,t.durationMs),r?100:80,r?3e4:1e4),intensity:h(d(e.intensity,t.intensity),0,3),fadeStart:n,fadeEnd:h(d(e.fadeEnd,t.fadeEnd),n+.01,.99),reachScale:h(d(e.reachScale,t.reachScale),r?1:.25,r?2.5:3),widthScale:h(d(e.widthScale,t.widthScale),.25,2),growthExponent:h(d(e.growthExponent,t.growthExponent),.2,3),displacementScale:h(d(e.displacementScale,t.displacementScale),0,3),particleCount:de(d(e.particleCount,t.particleCount),0,32),particleSizeScale:h(d(e.particleSizeScale,t.particleSizeScale),.25,3),particleSpeedScale:h(d(e.particleSpeedScale,t.particleSpeedScale),.25,3),particleGravityScale:h(d(e.particleGravityScale,t.particleGravityScale),0,3),seed:de(d(e.seed,t.seed),0,2147483647)}}function cl(e={}){let t=No;return{...Tt(e,t,"reveal"),coreRadiusScale:h(d(e.coreRadiusScale,t.coreRadiusScale),.25,3),coreBrightness:h(d(e.coreBrightness,t.coreBrightness),0,3),plasmaScale:h(d(e.plasmaScale,t.plasmaScale),.25,3),turbulenceScale:h(d(e.turbulenceScale,t.turbulenceScale),.25,3),rayStrength:h(d(e.rayStrength,t.rayStrength),0,3),swirlScale:h(d(e.swirlScale,t.swirlScale),0,3),shadeStrength:h(d(e.shadeStrength,t.shadeStrength),0,3),coronaRadiusScale:h(d(e.coronaRadiusScale,t.coronaRadiusScale),.25,3),coronaBrightness:h(d(e.coronaBrightness,t.coronaBrightness),0,3)}}function fl(e={}){let t=Xo;return{...Tt(e,t,"click"),maxConcurrent:de(d(e.maxConcurrent,t.maxConcurrent),1,8),coreRadiusScale:h(d(e.coreRadiusScale,t.coreRadiusScale),.25,3),coreBrightness:h(d(e.coreBrightness,t.coreBrightness),0,3),plasmaScale:h(d(e.plasmaScale,t.plasmaScale),.25,3),turbulenceScale:h(d(e.turbulenceScale,t.turbulenceScale),.25,3),rayStrength:h(d(e.rayStrength,t.rayStrength),0,3),swirlScale:h(d(e.swirlScale,t.swirlScale),0,3),shadeStrength:h(d(e.shadeStrength,t.shadeStrength),0,3)}}function dl(e={}){let t=qo,a=h(d(e.thinningStart,t.thinningStart),0,.94);return{...Tt(e,t,"reveal"),foamStrength:h(d(e.foamStrength,t.foamStrength),0,3),causticStrength:h(d(e.causticStrength,t.causticStrength),0,3),curlScale:h(d(e.curlScale,t.curlScale),0,3),flowScale:h(d(e.flowScale,t.flowScale),.25,3),flowSpeedScale:h(d(e.flowSpeedScale,t.flowSpeedScale),.25,3),depthShade:h(d(e.depthShade,t.depthShade),0,3),routeIrregularity:h(d(e.routeIrregularity,t.routeIrregularity),0,2),crestStrength:h(d(e.crestStrength,t.crestStrength),0,3),thinningStart:a,thinningEnd:h(d(e.thinningEnd,t.thinningEnd),a+.01,.99)}}function hl(e={}){let t=jo;return{...Tt(e,t,"click"),maxConcurrent:de(d(e.maxConcurrent,t.maxConcurrent),1,8),foamStrength:h(d(e.foamStrength,t.foamStrength),0,3),causticStrength:h(d(e.causticStrength,t.causticStrength),0,3),curlScale:h(d(e.curlScale,t.curlScale),0,3),flowScale:h(d(e.flowScale,t.flowScale),.25,3),flowSpeedScale:h(d(e.flowSpeedScale,t.flowSpeedScale),.25,3),depthShade:h(d(e.depthShade,t.depthShade),0,3),routeIrregularity:h(d(e.routeIrregularity,t.routeIrregularity),0,2),crestStrength:h(d(e.crestStrength,t.crestStrength),0,3)}}function pl(e={}){let t=$o;return{...Tt(e,t,"reveal"),crackCount:de(d(e.crackCount,t.crackCount),1,12),crackWidthScale:h(d(e.crackWidthScale,t.crackWidthScale),.25,3),crackHeat:h(d(e.crackHeat,t.crackHeat),0,3),plateScale:h(d(e.plateScale,t.plateScale),.25,3),channelWidthScale:h(d(e.channelWidthScale,t.channelWidthScale),.25,3),crustStrength:h(d(e.crustStrength,t.crustStrength),0,3),swirlScale:h(d(e.swirlScale,t.swirlScale),0,3),coreBrightness:h(d(e.coreBrightness,t.coreBrightness),0,3),branchSpreadScale:h(d(e.branchSpreadScale,t.branchSpreadScale),.25,2),churnScale:h(d(e.churnScale,t.churnScale),.25,3),coreRadiusScale:h(d(e.coreRadiusScale,t.coreRadiusScale),.25,3)}}function ml(e={}){let t=Yo;return{...Tt(e,t,"click"),maxConcurrent:de(d(e.maxConcurrent,t.maxConcurrent),1,8),crackCount:de(d(e.crackCount,t.crackCount),1,12),crackWidthScale:h(d(e.crackWidthScale,t.crackWidthScale),.25,3),crackHeat:h(d(e.crackHeat,t.crackHeat),0,3),plateScale:h(d(e.plateScale,t.plateScale),.25,3),channelWidthScale:h(d(e.channelWidthScale,t.channelWidthScale),.25,3),crustStrength:h(d(e.crustStrength,t.crustStrength),0,3),swirlScale:h(d(e.swirlScale,t.swirlScale),0,3),coreBrightness:h(d(e.coreBrightness,t.coreBrightness),0,3),branchSpreadScale:h(d(e.branchSpreadScale,t.branchSpreadScale),.25,2),churnScale:h(d(e.churnScale,t.churnScale),.25,3),coreRadiusScale:h(d(e.coreRadiusScale,t.coreRadiusScale),.25,3)}}var gl=["center","left top","center top","right top","left center","right center","left bottom","center bottom","right bottom"],vl=["wave","assembly","turbulence","glitch","vortex","blackhole","whirlpool","water","supernova","tidal","magma","custom"],Y={enabled:!1,type:"assembly",wave:{position:"center",durationMs:1200,softness:.22,waviness:.11},assembly:{sliceSizePx:29,speedMinMs:300,speedMaxMs:1600,staggerMs:6550,scatterPx:90,angleJitterDeg:35,blurPx:17.5,blurStart:.45},turbulence:{speedMinMs:400,speedMaxMs:2600,staggerMs:1400,intensity:1,detail:.5,glow:.6},glitch:{speedMinMs:200,speedMaxMs:1400,staggerMs:1200,intensity:1,detail:.5,glow:.8},vortex:{speedMinMs:300,speedMaxMs:1400,staggerMs:2600,intensity:1,detail:.5,glow:.7,swirl:1},blackhole:{speedMinMs:260,speedMaxMs:1050,staggerMs:3600,intensity:1,detail:.5,glow:.7,swirl:1.2,formMs:1150,collapseMs:420,arms:3,lensing:1,horizon:.12},whirlpool:{durationMs:5600,turns:4,tightness:.22,streak:.6,glow:.4},water:{durationMs:950,settleMs:520,rows:5,intensity:1.7,wobble:.7,refraction:1.3,softness:.35},supernova:{...No},tidal:{...qo},magma:{...$o}};function xl(e){let t=e.scatter??{},a=Y.assembly,r=h(Math.round(d(t.speedMinMs??e.speedMinMs,a.speedMinMs)),100,3e4),n=Math.max(r,h(Math.round(d(t.speedMaxMs??e.speedMaxMs,a.speedMaxMs)),100,3e4));return{sliceSizePx:h(Math.round(d(t.sliceSizePx??e.sliceSizePx,a.sliceSizePx)),8,200),speedMinMs:r,speedMaxMs:n,staggerMs:h(Math.round(d(t.staggerMs??e.staggerMs,a.staggerMs)),0,3e4),scatterPx:h(Math.round(d(t.scatterPx??e.scatterPx,a.scatterPx)),0,300),angleJitterDeg:h(d(t.angleJitterDeg??e.angleJitterDeg,a.angleJitterDeg),0,90),blurPx:h(d(t.blurPx??e.blurPx,a.blurPx??17.5),0,50),blurStart:h(d(t.blurStart??e.blurStart,a.blurStart??.45),0,.95)}}function va(e={},t){let a=h(Math.round(d(e.speedMinMs,t.speedMinMs)),50,3e4);return{speedMinMs:a,speedMaxMs:Math.max(a,h(Math.round(d(e.speedMaxMs,t.speedMaxMs)),50,3e4)),staggerMs:h(Math.round(d(e.staggerMs,t.staggerMs)),0,3e4),intensity:h(d(e.intensity,t.intensity),0,2),detail:h(d(e.detail,t.detail),0,1),glow:h(d(e.glow,t.glow),0,1)}}function bl(e={},t){return{...va(e,t),swirl:h(d(e.swirl,t.swirl),0,3)}}function Sl(e={},t){return{...va(e,t),swirl:h(d(e.swirl,t.swirl),0,3),formMs:h(Math.round(d(e.formMs,t.formMs)),0,1e4),collapseMs:h(Math.round(d(e.collapseMs,t.collapseMs)),0,1e4),arms:h(Math.round(d(e.arms,t.arms)),1,8),lensing:h(d(e.lensing,t.lensing),0,2),horizon:h(d(e.horizon,t.horizon),.02,.3)}}function yl(e={},t){return{durationMs:h(Math.round(d(e.durationMs,t.durationMs)),100,3e4),turns:h(d(e.turns,t.turns),0,6),tightness:h(d(e.tightness,t.tightness),.05,.5),streak:h(d(e.streak,t.streak),0,1),glow:h(d(e.glow,t.glow),0,1)}}function Ml(e={},t){return{durationMs:h(Math.round(d(e.durationMs,t.durationMs)),1,6e4),settleMs:h(Math.round(d(e.settleMs,t.settleMs)),0,2e4),rows:h(Math.round(d(e.rows,t.rows)),1,24),intensity:h(d(e.intensity,t.intensity),0,3),wobble:h(d(e.wobble,t.wobble),0,1),refraction:h(d(e.refraction,t.refraction),0,4),softness:h(d(e.softness,t.softness),0,1)}}function wl(e={}){let t=e.wave??{},a=e.assembly??{},r=gl.includes(t.position)?t.position:Y.wave.position,n=e.type,o=a.style;n==="assembly"&&(o==="turbulence"||o==="glitch"||o==="hadouken"||o==="vortex")&&(n=o==="hadouken"?"vortex":o),n==="hadouken"&&(n="vortex");let l=vl.includes(n)?n:Y.type;return{enabled:e.enabled===void 0?Y.enabled:!!e.enabled,type:l,wave:{position:r,durationMs:h(Math.round(d(t.durationMs,Y.wave.durationMs)),100,3e4),softness:h(d(t.softness,Y.wave.softness),0,1),waviness:h(d(t.waviness,Y.wave.waviness),0,1)},assembly:xl(a),turbulence:va(e.turbulence??a.turbulence,Y.turbulence),glitch:va(e.glitch??a.glitch,Y.glitch),vortex:bl(e.vortex??e.hadouken??a.vortex??a.hadouken,Y.vortex),blackhole:Sl(e.blackhole,Y.blackhole),whirlpool:yl(e.whirlpool,Y.whirlpool),water:Ml(e.water,Y.water),supernova:cl(e.supernova),tidal:dl(e.tidal),magma:pl(e.magma)}}var Pl=["leftToRight","rightToLeft","topToBottom","bottomToTop"],ie={gaps:{enabled:!1,coverage:.22,speed:1},width:{enabled:!1,coverage:.3,swingPx:1.25,swingPeriodMin:.21,swingPeriodMax:.55},stripe:{enabled:!1,coverage:.35,maxBrightness:.65,speed:1,thickestCount:3,hueDriftDeg:0,saturationBoost:0},motion:{enabled:!1,amplitudePx:4,staggerPx:24,maxOffsetPx:12,speed:1,direction:"leftToRight"}};function Cl(e={}){let t=e.gaps??{},a=e.width??{},r=e.stripe??{},n=e.motion??{};return{gaps:{enabled:t.enabled===void 0?ie.gaps.enabled:!!t.enabled,coverage:h(d(t.coverage,ie.gaps.coverage),0,1),speed:h(d(t.speed,ie.gaps.speed),.05,100)},width:{enabled:a.enabled===void 0?ie.width.enabled:!!a.enabled,coverage:h(d(a.coverage,ie.width.coverage),0,1),swingPx:h(d(a.swingPx,ie.width.swingPx),0,40),swingPeriodMin:h(d(a.swingPeriodMin,ie.width.swingPeriodMin),.02,5),swingPeriodMax:h(d(a.swingPeriodMax,ie.width.swingPeriodMax),.02,5)},stripe:{enabled:r.enabled===void 0?ie.stripe.enabled:!!r.enabled,coverage:h(d(r.coverage,ie.stripe.coverage),0,1),maxBrightness:h(d(r.maxBrightness,ie.stripe.maxBrightness),0,1),speed:h(d(r.speed,ie.stripe.speed),.05,100),thickestCount:h(Math.round(d(r.thickestCount,ie.stripe.thickestCount)),1,64),hueDriftDeg:h(d(r.hueDriftDeg,ie.stripe.hueDriftDeg),-180,180),saturationBoost:h(d(r.saturationBoost,ie.stripe.saturationBoost),0,1)},motion:{enabled:n.enabled===void 0?ie.motion.enabled:!!n.enabled,amplitudePx:h(d(n.amplitudePx,ie.motion.amplitudePx),0,64),staggerPx:h(d(n.staggerPx,ie.motion.staggerPx),1,512),maxOffsetPx:h(d(n.maxOffsetPx,ie.motion.maxOffsetPx),0,128),speed:Math.max(.05,d(n.speed,ie.motion.speed)),direction:Pl.includes(n.direction)?n.direction:ie.motion.direction}}}var et={enabled:!1,density:.5,randomVisibility:1,sizePx:1.5,brightness:.35,hueDriftDeg:0,saturationBoost:0};function Tl(e={}){return{enabled:e.enabled===void 0?et.enabled:!!e.enabled,density:h(d(e.density,et.density),0,1),randomVisibility:h(d(e.randomVisibility,et.randomVisibility),0,1),sizePx:h(d(e.sizePx,et.sizePx),1,2),brightness:h(d(e.brightness,et.brightness),0,1),hueDriftDeg:h(d(e.hueDriftDeg,et.hueDriftDeg),-180,180),saturationBoost:h(d(e.saturationBoost,et.saturationBoost),0,1)}}var fa={enabled:!1,minWidthPx:2,density:1};function Rl(e={}){return{enabled:e.enabled===void 0?fa.enabled:!!e.enabled,minWidthPx:h(d(e.minWidthPx,fa.minWidthPx),2,64),density:h(d(e.density,fa.density),0,1)}}var da={enabled:!1,brightness:.35,density:1};function El(e={}){return{enabled:e.enabled===void 0?da.enabled:!!e.enabled,brightness:h(d(e.brightness,da.brightness),0,1),density:h(d(e.density,da.density),0,1)}}var tt={enabled:!1,maxDistanceRatio:.2,color:16777215,colorLinkedToFrame:!0,strokeWidthPx:1,dashLengthPx:0,dashGapPx:0};function Al(e={}){return{enabled:e.enabled===void 0?tt.enabled:!!e.enabled,maxDistanceRatio:h(d(e.maxDistanceRatio,tt.maxDistanceRatio),.01,1),color:Math.round(h(d(e.color,tt.color),0,16777215)),colorLinkedToFrame:e.colorLinkedToFrame===void 0?tt.colorLinkedToFrame:!!e.colorLinkedToFrame,strokeWidthPx:h(d(e.strokeWidthPx,tt.strokeWidthPx),.25,8),dashLengthPx:h(d(e.dashLengthPx,tt.dashLengthPx),0,64),dashGapPx:h(d(e.dashGapPx,tt.dashGapPx),0,64)}}var ve={enabled:!1,revealOn:"always",staggerMs:300,fadeMs:450,growMs:180,spawnScale:.9,luminanceThreshold:.7,highlightedStripeCount:3,groupDistanceCells:1,maxFrames:0,color:16777215,strokeWidthPx:1,cornerSizePx:3,dashLengthPx:0,dashGapPx:0,fontSizePx:10,coordinateColor:16777215,connection:{...tt}};function kl(e){return Zi.includes(e)?e:ve.revealOn}function Dl(e={}){return{enabled:e.enabled===void 0?ve.enabled:!!e.enabled,revealOn:kl(e.revealOn),staggerMs:h(d(e.staggerMs,ve.staggerMs),0,4e3),fadeMs:h(d(e.fadeMs,ve.fadeMs),0,4e3),growMs:h(d(e.growMs,ve.growMs),0,4e3),spawnScale:h(d(e.spawnScale,ve.spawnScale),.1,1),luminanceThreshold:h(d(e.luminanceThreshold,ve.luminanceThreshold),0,1),highlightedStripeCount:Math.round(h(d(e.highlightedStripeCount,ve.highlightedStripeCount),1,16)),groupDistanceCells:Math.round(h(d(e.groupDistanceCells,ve.groupDistanceCells),0,8)),maxFrames:Math.round(h(d(e.maxFrames,ve.maxFrames),0,64)),color:Math.round(h(d(e.color,ve.color),0,16777215)),strokeWidthPx:h(d(e.strokeWidthPx,ve.strokeWidthPx),.25,8),cornerSizePx:Math.round(h(d(e.cornerSizePx,ve.cornerSizePx),0,16)),dashLengthPx:h(d(e.dashLengthPx,ve.dashLengthPx),0,64),dashGapPx:h(d(e.dashGapPx,ve.dashGapPx),0,64),fontSizePx:Math.round(h(d(e.fontSizePx,ve.fontSizePx),6,48)),coordinateColor:Math.round(h(d(e.coordinateColor,ve.coordinateColor),0,16777215)),connection:Al(e.connection)}}var Be={segCount:22,segSpacingPx:10,turnRate:.9,turnVariation:.8,visibleMinMs:7e3,visibleMaxMs:13e3,hiddenMinMs:800,hiddenMaxMs:2600,lifeMinMs:12e3,lifeMaxMs:24e3,edgeMarginRatio:.12},ye={enabled:!1,direction:"up",minWidthRatio:.0223,maxWidthRatio:.0453,minHeightRatio:.0245,maxHeightRatio:.08,baseSpeedPxPerSec:40,speedVariation:1,spawnIntervalMs:50,spawnJitterMs:80,maxActive:48,edgeSharpness:1,opacityMin:.3,opacityMax:1,vortexSingular:{...Be}},Fl=["up","down","left","right","upDown","leftRight","vortexSingular"];function Ll(e){return Fl.includes(e)?e:"up"}function Ul(e={}){let t=h(Math.round(d(e.lifeMinMs,Be.lifeMinMs)),500,6e4),a=h(Math.round(d(e.visibleMinMs,Be.visibleMinMs)),500,6e4),r=h(Math.round(d(e.hiddenMinMs,Be.hiddenMinMs)),0,3e4);return{segCount:h(Math.round(d(e.segCount,Be.segCount)),2,80),segSpacingPx:h(d(e.segSpacingPx,Be.segSpacingPx),2,60),turnRate:h(d(e.turnRate,Be.turnRate),.05,6),turnVariation:h(d(e.turnVariation,Be.turnVariation),0,1),visibleMinMs:a,visibleMaxMs:h(Math.round(d(e.visibleMaxMs,Be.visibleMaxMs)),a,12e4),hiddenMinMs:r,hiddenMaxMs:h(Math.round(d(e.hiddenMaxMs,Be.hiddenMaxMs)),r,6e4),lifeMinMs:t,lifeMaxMs:h(Math.round(d(e.lifeMaxMs,Be.lifeMaxMs)),t,12e4),edgeMarginRatio:h(d(e.edgeMarginRatio,Be.edgeMarginRatio),0,.4)}}function Bl(e={}){let t=h(d(e.minWidthRatio,ye.minWidthRatio),.001,.5),a=h(d(e.maxWidthRatio,ye.maxWidthRatio),t,.5),r=h(d(e.minHeightRatio,ye.minHeightRatio),.001,.5),n=h(d(e.maxHeightRatio,ye.maxHeightRatio),r,.5),o=h(d(e.opacityMin,ye.opacityMin),0,1),l=h(d(e.opacityMax,ye.opacityMax),o,1);return{enabled:e.enabled===void 0?ye.enabled:!!e.enabled,direction:Ll(e.direction??ye.direction),minWidthRatio:t,maxWidthRatio:a,minHeightRatio:r,maxHeightRatio:n,baseSpeedPxPerSec:h(d(e.baseSpeedPxPerSec,ye.baseSpeedPxPerSec),1,500),speedVariation:h(d(e.speedVariation,ye.speedVariation),0,1),spawnIntervalMs:h(Math.round(d(e.spawnIntervalMs,ye.spawnIntervalMs)),20,5e3),spawnJitterMs:h(Math.round(d(e.spawnJitterMs,ye.spawnJitterMs)),0,2e3),maxActive:h(Math.round(d(e.maxActive,ye.maxActive)),1,200),edgeSharpness:h(d(e.edgeSharpness,ye.edgeSharpness),0,1),opacityMin:o,opacityMax:l,vortexSingular:Ul(e.vortexSingular)}}var $e={enabled:!1,start:0,end:.1,power:1,sides:{top:!0,right:!0,bottom:!0,left:!0}};function Il(e={}){return{top:e.top===void 0?$e.sides.top:!!e.top,right:e.right===void 0?$e.sides.right:!!e.right,bottom:e.bottom===void 0?$e.sides.bottom:!!e.bottom,left:e.left===void 0?$e.sides.left:!!e.left}}function _l(e={}){let t=h(d(e.start,$e.start),0,.5),a=h(d(e.end,$e.end),t+.001,.5);return{enabled:e.enabled===void 0?$e.enabled:!!e.enabled,start:t,end:a,power:h(d(e.power,$e.power),.1,4),sides:Il(e.sides)}}var Ko={radiusScale:.31,starDensity:1,starSizePx:2.2,starSizeRandomness:.77,starGrowScale:1.35,starPushPx:1.9,twinkleAmount:.18,twinkleSpeed:1,linkThicknessPx:2.9,linkBrightness:1,linkGrooveDepth:1,linkShearPx:13.5,linkMaxDistScale:.2184,linkFormMs:210,linkHoldMs:0,linkDissolveMs:540,maxLinks:48,maxStars:64,pulseEnabled:!0,pulseDurationMs:700,pulseCoreLenPx:3.4,pulseTailLenPx:27,pulseBrightness:1,pulseRelayHops:2,pulseCooldownMs:900,flareMs:460,flareScale:.85,polygonFlashEnabled:!0,polygonFlashStrength:1};function Wl(e={}){let t=Ko;return{radiusScale:h(d(e.radiusScale,t.radiusScale),.02,2),starDensity:h(d(e.starDensity,t.starDensity),.05,4),starSizePx:h(d(e.starSizePx,t.starSizePx),.2,20),starSizeRandomness:h(d(e.starSizeRandomness,t.starSizeRandomness),0,1),starGrowScale:h(d(e.starGrowScale,t.starGrowScale),0,6),starPushPx:h(d(e.starPushPx,t.starPushPx),0,40),twinkleAmount:h(d(e.twinkleAmount,t.twinkleAmount),0,1),twinkleSpeed:h(d(e.twinkleSpeed,t.twinkleSpeed),0,10),linkThicknessPx:h(d(e.linkThicknessPx,t.linkThicknessPx),.2,20),linkBrightness:h(d(e.linkBrightness,t.linkBrightness),0,4),linkGrooveDepth:h(d(e.linkGrooveDepth,t.linkGrooveDepth),0,4),linkShearPx:h(d(e.linkShearPx,t.linkShearPx),0,80),linkMaxDistScale:h(d(e.linkMaxDistScale,t.linkMaxDistScale),.02,1),linkFormMs:h(d(e.linkFormMs,t.linkFormMs),10,5e3),linkHoldMs:h(d(e.linkHoldMs,t.linkHoldMs),0,1e4),linkDissolveMs:h(d(e.linkDissolveMs,t.linkDissolveMs),10,1e4),maxLinks:de(d(e.maxLinks,t.maxLinks),4,80),maxStars:de(d(e.maxStars,t.maxStars),4,160),pulseEnabled:e.pulseEnabled===void 0?t.pulseEnabled:!!e.pulseEnabled,pulseDurationMs:h(d(e.pulseDurationMs,t.pulseDurationMs),60,1e4),pulseCoreLenPx:h(d(e.pulseCoreLenPx,t.pulseCoreLenPx),.5,60),pulseTailLenPx:h(d(e.pulseTailLenPx,t.pulseTailLenPx),.5,240),pulseBrightness:h(d(e.pulseBrightness,t.pulseBrightness),0,4),pulseRelayHops:de(d(e.pulseRelayHops,t.pulseRelayHops),0,6),pulseCooldownMs:h(d(e.pulseCooldownMs,t.pulseCooldownMs),0,2e4),flareMs:h(d(e.flareMs,t.flareMs),30,5e3),flareScale:h(d(e.flareScale,t.flareScale),0,6),polygonFlashEnabled:e.polygonFlashEnabled===void 0?t.polygonFlashEnabled:!!e.polygonFlashEnabled,polygonFlashStrength:h(d(e.polygonFlashStrength,t.polygonFlashStrength),0,4)}}var Jo={nodeCount:13,headStiffness:5200,headDamping:104,chainStiffness:4200,chainDamping:80,maxLinkPx:22,headRadiusPx:10.6,tailRadiusPx:3.2,stretchThinning:.62,smoothUnionPx:5.4,bodyBrightness:1,auraStrength:1,bodyPushPx:12,presenceRiseRate:15,presenceFallRate:2.6,embersEnabled:!0,emberRatePerSec:92,emberMaxCount:210,emberSizePx:2.9,emberSpeedMinPxPerSec:26,emberSpeedMaxPxPerSec:56,emberSpreadRad:.85,emberLifetimeMinMs:560,emberLifetimeMaxMs:1400,emberBrightness:1,emberFadeInFraction:.12,seed:10368889};function Gl(e={}){let t=Jo,a=h(d(e.emberSpeedMinPxPerSec,t.emberSpeedMinPxPerSec),0,2e3),r=Math.max(a,h(d(e.emberSpeedMaxPxPerSec,t.emberSpeedMaxPxPerSec),0,2e3)),n=h(d(e.emberLifetimeMinMs,t.emberLifetimeMinMs),60,2e4),o=Math.max(n,h(d(e.emberLifetimeMaxMs,t.emberLifetimeMaxMs),60,2e4));return{nodeCount:de(d(e.nodeCount,t.nodeCount),2,48),headStiffness:h(d(e.headStiffness,t.headStiffness),100,4e4),headDamping:h(d(e.headDamping,t.headDamping),1,600),chainStiffness:h(d(e.chainStiffness,t.chainStiffness),100,4e4),chainDamping:h(d(e.chainDamping,t.chainDamping),1,600),maxLinkPx:h(d(e.maxLinkPx,t.maxLinkPx),2,200),headRadiusPx:h(d(e.headRadiusPx,t.headRadiusPx),.5,60),tailRadiusPx:h(d(e.tailRadiusPx,t.tailRadiusPx),0,40),stretchThinning:h(d(e.stretchThinning,t.stretchThinning),0,1),smoothUnionPx:h(d(e.smoothUnionPx,t.smoothUnionPx),.1,40),bodyBrightness:h(d(e.bodyBrightness,t.bodyBrightness),0,2),auraStrength:h(d(e.auraStrength,t.auraStrength),0,3),bodyPushPx:h(d(e.bodyPushPx,t.bodyPushPx),0,60),presenceRiseRate:h(d(e.presenceRiseRate,t.presenceRiseRate),.5,60),presenceFallRate:h(d(e.presenceFallRate,t.presenceFallRate),.2,60),embersEnabled:e.embersEnabled===void 0?t.embersEnabled:!!e.embersEnabled,emberRatePerSec:h(d(e.emberRatePerSec,t.emberRatePerSec),0,400),emberMaxCount:de(d(e.emberMaxCount,t.emberMaxCount),1,512),emberSizePx:h(d(e.emberSizePx,t.emberSizePx),.2,40),emberSpeedMinPxPerSec:a,emberSpeedMaxPxPerSec:r,emberSpreadRad:h(d(e.emberSpreadRad,t.emberSpreadRad),0,Math.PI),emberLifetimeMinMs:n,emberLifetimeMaxMs:o,emberBrightness:h(d(e.emberBrightness,t.emberBrightness),0,4),emberFadeInFraction:h(d(e.emberFadeInFraction,t.emberFadeInFraction),0,.9),seed:de(d(e.seed,t.seed),0,1e8)}}var se={enabled:!1,type:"default",particleRadius:40,particleAlpha:.07,particleLifeMs:960,particleLifeJitterMs:100,emitterVelocitySmoothing:.7,particleVelocityScale:.01,particleTangentVelocity:1.65,particleDamping:.96,particleSpacingPx:3,maxEmitPerTick:10,spreadMinPx:1.5,spreadMaxPx:21,spinStrength:.04,densityRadiusMinScale:.2,densityRadiusLifeScale:1,pushRadiusScale:.9,pushStrengthPx:48,pushLagPx:0,pushWobblePx:8,pushLeadBlackAlpha:0,constellation:{...Ko},comet:{...Jo}};function de(e,t,a){return Math.round(h(e,t,a))}function Qo(e={}){let t=h(d(e.spreadMinPx,se.spreadMinPx),0,80),a=Math.max(t,h(d(e.spreadMaxPx,se.spreadMaxPx),0,120));return{enabled:e.enabled===void 0?se.enabled:!!e.enabled,type:e.type==="wave"||e.type==="constellation"||e.type==="comet"?e.type:"default",particleRadius:h(d(e.particleRadius,se.particleRadius),.5,80),particleAlpha:h(d(e.particleAlpha,se.particleAlpha),0,1),particleLifeMs:h(d(e.particleLifeMs,se.particleLifeMs),50,1e4),particleLifeJitterMs:h(d(e.particleLifeJitterMs,se.particleLifeJitterMs),0,1e4),emitterVelocitySmoothing:h(d(e.emitterVelocitySmoothing,se.emitterVelocitySmoothing),0,.98),particleVelocityScale:h(d(e.particleVelocityScale,se.particleVelocityScale),0,2),particleTangentVelocity:h(d(e.particleTangentVelocity,se.particleTangentVelocity),0,20),particleDamping:h(d(e.particleDamping,se.particleDamping),0,1),particleSpacingPx:h(d(e.particleSpacingPx,se.particleSpacingPx),.5,80),maxEmitPerTick:de(d(e.maxEmitPerTick,se.maxEmitPerTick),1,200),spreadMinPx:t,spreadMaxPx:a,spinStrength:h(d(e.spinStrength,se.spinStrength),0,.2),densityRadiusMinScale:h(d(e.densityRadiusMinScale,se.densityRadiusMinScale),0,3),densityRadiusLifeScale:h(d(e.densityRadiusLifeScale,se.densityRadiusLifeScale),0,3),pushRadiusScale:h(d(e.pushRadiusScale,se.pushRadiusScale),0,8),pushStrengthPx:h(d(e.pushStrengthPx,se.pushStrengthPx),0,120),pushLagPx:h(d(e.pushLagPx,se.pushLagPx),0,80),pushWobblePx:h(d(e.pushWobblePx,se.pushWobblePx),0,80),pushLeadBlackAlpha:h(d(e.pushLeadBlackAlpha,se.pushLeadBlackAlpha),0,1),constellation:Wl(e.constellation),comet:Gl(e.comet)}}var Zo={maxConcurrent:4,ringReachPx:168,ringDurationMs:600,ringThicknessPx:24,ringRefractionPx:20,flashRadiusPx:24,flashDurationMs:80,flashBrightness:1,debrisCount:24,debrisSpeedPxPerSec:315,debrisSpeedVariation:.317,debrisDrag:1.55,debrisGravityPxPerSec2:360,debrisLifetimeMs:1060,debrisLifetimeVariation:.302,debrisSizePx:2.6,debrisBrightness:1,craterRadiusPx:118,craterDepth:1,craterRelaxFastMs:260,craterRelaxSlowMs:1450,craterLifeMs:3400,craterRimStrength:1,seed:1};function Ol(e={}){let t=Zo;return{maxConcurrent:de(d(e.maxConcurrent,t.maxConcurrent),1,16),ringReachPx:h(d(e.ringReachPx,t.ringReachPx),8,1200),ringDurationMs:h(d(e.ringDurationMs,t.ringDurationMs),40,8e3),ringThicknessPx:h(d(e.ringThicknessPx,t.ringThicknessPx),1,200),ringRefractionPx:h(d(e.ringRefractionPx,t.ringRefractionPx),0,160),flashRadiusPx:h(d(e.flashRadiusPx,t.flashRadiusPx),1,400),flashDurationMs:h(d(e.flashDurationMs,t.flashDurationMs),8,2e3),flashBrightness:h(d(e.flashBrightness,t.flashBrightness),0,4),debrisCount:de(d(e.debrisCount,t.debrisCount),0,96),debrisSpeedPxPerSec:h(d(e.debrisSpeedPxPerSec,t.debrisSpeedPxPerSec),10,4e3),debrisSpeedVariation:h(d(e.debrisSpeedVariation,t.debrisSpeedVariation),0,1),debrisDrag:h(d(e.debrisDrag,t.debrisDrag),.05,12),debrisGravityPxPerSec2:h(d(e.debrisGravityPxPerSec2,t.debrisGravityPxPerSec2),0,4e3),debrisLifetimeMs:h(d(e.debrisLifetimeMs,t.debrisLifetimeMs),60,1e4),debrisLifetimeVariation:h(d(e.debrisLifetimeVariation,t.debrisLifetimeVariation),0,1),debrisSizePx:h(d(e.debrisSizePx,t.debrisSizePx),.2,40),debrisBrightness:h(d(e.debrisBrightness,t.debrisBrightness),0,4),craterRadiusPx:h(d(e.craterRadiusPx,t.craterRadiusPx),4,1200),craterDepth:h(d(e.craterDepth,t.craterDepth),0,4),craterRelaxFastMs:h(d(e.craterRelaxFastMs,t.craterRelaxFastMs),20,1e4),craterRelaxSlowMs:h(d(e.craterRelaxSlowMs,t.craterRelaxSlowMs),20,2e4),craterLifeMs:h(d(e.craterLifeMs,t.craterLifeMs),100,2e4),craterRimStrength:h(d(e.craterRimStrength,t.craterRimStrength),0,4),seed:Math.round(h(d(e.seed,t.seed),0,1e6))}}var fe={enabled:!1,type:"default",lifeMs:630,startRadiusPx:6,maxRadiusPx:120,startStrokeWidthPx:24,endStrokeWidthPx:12,maxWaves:12,pushStrengthPx:38,pushBandScale:3.2,stripeWhiteAlpha:.5,detonation:{...Zo},supernova:{...Xo},tidal:{...jo},magma:{...Yo}};function ei(e={}){return{enabled:e.enabled===void 0?fe.enabled:!!e.enabled,type:e.type!==void 0&&el.includes(e.type)?e.type:"default",lifeMs:h(d(e.lifeMs,fe.lifeMs),80,1e4),startRadiusPx:h(d(e.startRadiusPx,fe.startRadiusPx),1,120),maxRadiusPx:h(d(e.maxRadiusPx,fe.maxRadiusPx),4,600),startStrokeWidthPx:h(d(e.startStrokeWidthPx,fe.startStrokeWidthPx),.5,80),endStrokeWidthPx:h(d(e.endStrokeWidthPx,fe.endStrokeWidthPx),.25,40),maxWaves:de(d(e.maxWaves,fe.maxWaves),1,32),pushStrengthPx:h(d(e.pushStrengthPx,fe.pushStrengthPx),0,200),pushBandScale:h(d(e.pushBandScale,fe.pushBandScale),1,8),stripeWhiteAlpha:h(d(e.stripeWhiteAlpha,fe.stripeWhiteAlpha),0,1),detonation:Ol(e.detonation),supernova:fl(e.supernova),tidal:hl(e.tidal),magma:ml(e.magma)}}var ke={enabled:!1,mode:"random",colorMode:"white",color:16777215,coverage:.1,positionX:.5,positionY:.5,areaWidth:1,areaHeight:1,text:"CF",textCopies:1,fontFamily:"Geist Mono Medium",sizeScale:.9,shuffleSpeed:1},zl=new Set(["Geist Mono Medium","monospace","Arial, sans-serif","Georgia, serif",'"Courier New", monospace','"Times New Roman", serif',"Impact, fantasy"]);function Hl(e={}){return{enabled:e.enabled===void 0?ke.enabled:!!e.enabled,mode:e.mode==="text"?"text":"random",colorMode:e.colorMode==="colorful"?"colorful":"white",color:Math.round(h(d(e.color,ke.color),0,16777215)),coverage:h(d(e.coverage,ke.coverage),0,1),positionX:h(d(e.positionX,ke.positionX),0,1),positionY:h(d(e.positionY,ke.positionY),0,1),areaWidth:h(d(e.areaWidth,ke.areaWidth),.01,1),areaHeight:h(d(e.areaHeight,ke.areaHeight),.01,1),text:typeof e.text=="string"?e.text.slice(0,512):ke.text,textCopies:de(d(e.textCopies,ke.textCopies),1,100),fontFamily:typeof e.fontFamily=="string"&&zl.has(e.fontFamily)?e.fontFamily:ke.fontFamily,sizeScale:h(d(e.sizeScale,ke.sizeScale),.1,1),shuffleSpeed:h(d(e.shuffleSpeed,ke.shuffleSpeed),.05,10)}}var ti=["normal","multiply","screen","overlay","darken","lighten","difference","exclusion"],Vl=Object.fromEntries(ti.map((e,t)=>[e,t])),dt={mode:"luminance",stripeBlendMode:"normal",imageColorLightness:.2,imageColorDensity:1,imageColorRemoveThin:0,imageColorBoostThick:0,autoDetectBackground:!0,backgroundColor:0,gradient:{enabled:!1,...je,stops:[...je.stops]}};function Nl(e={}){let t=e.gradient??{};return{mode:e.mode==="colors"?"colors":"luminance",stripeBlendMode:ti.includes(e.stripeBlendMode)?e.stripeBlendMode:dt.stripeBlendMode,imageColorLightness:h(d(e.imageColorLightness,dt.imageColorLightness),-1,1),imageColorDensity:h(d(e.imageColorDensity,dt.imageColorDensity),0,1),imageColorRemoveThin:h(d(e.imageColorRemoveThin,dt.imageColorRemoveThin),0,.95),imageColorBoostThick:h(d(e.imageColorBoostThick,dt.imageColorBoostThick),0,2),autoDetectBackground:e.autoDetectBackground===void 0?!0:!!e.autoDetectBackground,backgroundColor:Math.round(h(d(e.backgroundColor,0),0,16777215)),gradient:{enabled:t.enabled===void 0?dt.gradient.enabled:!!t.enabled,...Oo(t)}}}var Xl=["sharp","abstract","charcoal","pencil","brush","halftone","risograph","stainedGlass","paperCutout","crt","glitch","vhs","amber","gummy"];function ql(e){return Xl.includes(e)?e:"sharp"}function jl(e){let t=Array.isArray(e)?e:[],a=[];for(let r=0;r<4;r++)a.push(h(d(t[r],.5),0,1));return a}var Xh={transform:tl,adjustments:il,background:ce,grid:nl,stripes:Vo.map(e=>({...e})),stripesEnabled:!0,fieldScale:1,maxFps:0,reveal:{...Y,wave:{...Y.wave},assembly:{...Y.assembly},turbulence:{...Y.turbulence},glitch:{...Y.glitch},vortex:{...Y.vortex},water:{...Y.water},supernova:{...Y.supernova},tidal:{...Y.tidal},magma:{...Y.magma}},sparkle:{gaps:{...ie.gaps},width:{...ie.width},stripe:{...ie.stripe},motion:{...ie.motion}},stripeDots:{...et},stripeBorder:{...fa},gridLines:{...da},frames:{...ve},flames:{...ye},edgeMask:{...$e},cursorTrail:{...se},clickWave:{...fe,supernova:{...fe.supernova},tidal:{...fe.tidal},magma:{...fe.magma}},letters:{...ke},colors:{...dt},renderMode:"sharp",renderIntensity:1,renderParams:[.5,.5,.5,.5],renderColorA:2236962,renderColorB:16777215};function Ke(e={}){return{transform:al(e.transform),adjustments:ll(e.adjustments),background:Ho(e.background),grid:ol(e.grid),stripes:ul(e.stripes,Vo),stripesEnabled:e.stripesEnabled===void 0?!0:!!e.stripesEnabled,fieldScale:h(d(e.fieldScale,1),.25,2),maxFps:Math.max(0,d(e.maxFps,0)),reveal:wl(e.reveal),sparkle:Cl(e.sparkle),stripeDots:Tl(e.stripeDots),stripeBorder:Rl(e.stripeBorder),gridLines:El(e.gridLines),frames:Dl(e.frames),flames:Bl(e.flames),edgeMask:_l(e.edgeMask),cursorTrail:Qo(e.cursorTrail),clickWave:ei(e.clickWave),letters:Hl(e.letters),colors:Nl(e.colors),renderMode:ql(e.renderMode),renderIntensity:h(d(e.renderIntensity,1),0,1),renderParams:jl(e.renderParams),renderColorA:Math.round(h(d(e.renderColorA,2236962),0,16777215)),renderColorB:Math.round(h(d(e.renderColorB,16777215),0,16777215))}}function Nt(e){return typeof e=="object"&&!!e&&!Array.isArray(e)}function ai(e,t){let a={...e};for(let[r,n]of Object.entries(t)){let o=a[r];a[r]=Nt(o)&&Nt(n)?ai(o,n):n}return a}function ri(e,t){let a={};for(let[r,n]of Object.entries(t)){let o=e[r];if(Nt(o)&&Nt(n)){let l=ri(o,n);Object.keys(l).length>0&&(a[r]=l);continue}if(Array.isArray(o)&&Array.isArray(n)){JSON.stringify(o)!==JSON.stringify(n)&&(a[r]=n.map(l=>Nt(l)?{...l}:l));continue}Object.is(o,n)||(a[r]=n)}return a}function xa(e,t="light"){let{dark:a,...r}=e;return t!=="dark"||!a?r:ai(r,a)}function ni(e,t){return ri(e,t)}function qh(e){let t=Ke(xa(e,"light"));if(!e.dark)return t;let a=ni(t,Ke(xa(e,"dark")));return Object.keys(a).length>0?{...t,dark:a}:t}var Me=1e-4;function zt(e,t,a){return(t.x-e.x)*(a.y-e.y)-(t.y-e.y)*(a.x-e.x)}function Ht(e,t,a){return Math.abs(zt(t,a,e))>Me?!1:e.x>=Math.min(t.x,a.x)-Me&&e.x<=Math.max(t.x,a.x)+Me&&e.y>=Math.min(t.y,a.y)-Me&&e.y<=Math.max(t.y,a.y)+Me}function $l(e,t,a,r){let n=zt(e,t,a),o=zt(e,t,r),l=zt(a,r,e),i=zt(a,r,t);return(n>Me&&o<-1e-4||n<-1e-4&&o>Me)&&(l>Me&&i<-1e-4||l<-1e-4&&i>Me)?!0:Ht(a,e,t)||Ht(r,e,t)||Ht(e,a,r)||Ht(t,a,r)}function bn(e,t){let a=!1;for(let r=0;r<t.length;r++){let n=t[r],o=t[(r+1)%t.length];if(Ht(e,n,o))return!0;n.y>e.y!=o.y>e.y&&e.x<(o.x-n.x)*(e.y-n.y)/(o.y-n.y)+n.x&&(a=!a)}return a}function Yl(e,t){for(let a=0;a<e.length;a++){let r=e[a],n=e[(a+1)%e.length];for(let o=0;o<t.length;o++)if($l(r,n,t[o],t[(o+1)%t.length]))return!0}return bn(e[0],t)||bn(t[0],e)}function Sn(e){let t=0,a=0,r=0;for(let n=0;n<e.length;n++){let o=e[n],l=e[(n+1)%e.length],i=o.x*l.y-l.x*o.y;t+=i,a+=(o.x+l.x)*i,r+=(o.y+l.y)*i}return Math.abs(t)<=Me?{x:e.reduce((n,o)=>n+o.x,0)/e.length,y:e.reduce((n,o)=>n+o.y,0)/e.length}:{x:a/(3*t),y:r/(3*t)}}function yn(e,t,a){let r=t.x-e.x,n=t.y-e.y,o=[];for(let l=0;l<a.length;l++){let i=a[l],s=a[(l+1)%a.length],u=s.x-i.x,f=s.y-i.y,c=r*f-n*u;if(Math.abs(c)<=Me)continue;let m=i.x-e.x,g=i.y-e.y,b=(m*f-g*u)/c,S=(m*n-g*r)/c;b<-1e-4||b>1.0001||S<-1e-4||S>1.0001||o.push(Math.max(0,Math.min(1,b)))}return o}function Kl(e,t){if(Yl(e,t))return null;let a=Sn(e),r=Sn(t);if(Math.hypot(r.x-a.x,r.y-a.y)<=Me)return null;let n=Math.max(0,...yn(a,r,e)),o=yn(a,r,t),l=o.length>0?Math.min(...o):1;if(l-n<=Me)return null;let i=f=>({x:a.x+(r.x-a.x)*f,y:a.y+(r.y-a.y)*f}),s=i(n),u=i(l);return{from:s,to:u,distance:Math.hypot(u.x-s.x,u.y-s.y)}}function Jl(e){let t=e.x+e.width*.5,a=e.y+e.height*.5,r=t+(e.x-t)*e.scale,n=a+(e.y-a)*e.scale,o=e.width*e.scale,l=e.height*e.scale;return[{x:r,y:n},{x:r+o,y:n},{x:r+o,y:n+l},{x:r,y:n+l}]}function Ql(e,t,a,r){let n=t*Math.min(Math.max(0,a),Math.max(0,r));if(!Number.isFinite(n)||n<=Me)return[];let o=e.filter(i=>i.alpha>0&&i.scale>0).map(i=>({box:i,polygon:Jl(i)})),l=[];for(let i=0;i<o.length;i++)for(let s=i+1;s<o.length;s++){let u=o[i],f=o[s],c=Kl(u.polygon,f.polygon);!c||c.distance>n+Me||l.push({...c,alpha:Math.min(u.box.alpha,f.box.alpha)})}return l}function Zl(e){let t=new Map;for(let a of e){let r=Math.round(Math.max(0,Math.min(1,a.alpha))*20)/20;if(r<=0)continue;let n=t.get(r);n?n.push(a):t.set(r,[a])}return t}function es(e,t){return e.colorLinkedToFrame?t:e.color}var ts='"Paper Mono", "SFMono-Regular", Menlo, Monaco, Consolas, monospace',as=8,rs=6;function oi(e,t){return e>0?[e,t]:[]}function ha(e,t,a){let r=t>>16&255,n=t>>8&255,o=t&255;return e?`color(display-p3 ${r/255} ${n/255} ${o/255} / ${a})`:`rgb(${r} ${n} ${o} / ${a})`}function ii(e){return e.getContextAttributes?.()?.colorSpace==="display-p3"}function ns(e,t,a,r){if(!r.enabled||t.alpha<=0||a.length===0)return;let n=Zl(a);if(n.size===0)return;let o=ii(e),l=es(r,t.color);e.save(),e.setTransform(t.scale,0,0,t.scale,0,0),e.lineWidth=r.strokeWidthPx,e.setLineDash(oi(r.dashLengthPx,r.dashGapPx));for(let[i,s]of n){e.strokeStyle=ha(o,l,.92*t.alpha*i),e.beginPath();for(let u of s)e.moveTo(u.from.x,u.from.y),e.lineTo(u.to.x,u.to.y);e.stroke()}e.restore()}function os(e,t){let{connection:a}=t;!a.enabled||t.alpha<=0||t.boxes.length<2||ns(e,t,Ql(t.boxes,a.maxDistanceRatio,t.cssWidth,t.cssHeight),a)}function jh(e,t){if(t.alpha<=0||t.boxes.length===0)return;let{fontSizePx:a}=t,r=ii(e);os(e,t),e.save(),e.setTransform(t.scale,0,0,t.scale,0,0),e.lineWidth=t.strokeWidthPx,e.font=`${a}px ${ts}`,e.textAlign="center",e.textBaseline="alphabetic";let n=t.cornerSizePx/2;for(let o of t.boxes){let l=t.alpha*o.alpha;if(l<=0)continue;let i=ha(r,t.color,.92*l),s=ha(r,t.color,l),u=ha(r,t.coordinateColor,l),{x:f,y:c,width:m,height:g,labelX:b,labelY:S}=o;if(o.scale!==1){let C=o.x+o.width*.5,w=o.y+o.height*.5;f=C+(o.x-C)*o.scale,c=w+(o.y-w)*o.scale,m=o.width*o.scale,g=o.height*o.scale,b=C+(o.labelX-C)*o.scale,S=w+(o.labelY-w)*o.scale}if(e.strokeStyle=i,e.setLineDash(oi(t.dashLengthPx,t.dashGapPx)),e.strokeRect(f,c,m,g),e.setLineDash([]),e.fillStyle=i,t.cornerSizePx>0)for(let[C,w]of[[f,c],[f+m,c],[f,c+g],[f+m,c+g]])e.fillRect(C-n,w-n,t.cornerSizePx,t.cornerSizePx);let v=e.measureText(o.label),M=Math.ceil(v.width)+as,y=a+rs,x=S+y<=t.cssHeight?S:Math.max(0,S-y),T=v.actualBoundingBoxAscent||a*.75,R=v.actualBoundingBoxDescent||a*.2;e.fillStyle=s,e.fillRect(b,x,M,y),e.fillStyle=u,e.fillText(o.label,b+M*.5,x+y*.5+(T-R)*.5)}e.restore()}var Vt=new Set,Fr=500,Xt=null;function Mn(){return{total:0,rendering:0,paused:0,revealOpen:0,megapixelsPerFrame:0,shadedMegapixelsPerFrame:0,blitsPerSecond:0,sampleMs:Fr,instances:[]}}function is(){Xt||(Xt=setInterval(()=>wn(Mn()),Fr),wn(Mn()))}function ls(){Xt&&clearInterval(Xt),Xt=null}function wn(e){for(let t of[...Vt])t(e)}function $h(e,t){t?.intervalMs&&(Fr=t.intervalMs);let a=Vt.size===0;return Vt.add(e),a&&is(),()=>{Vt.delete(e),!(Vt.size>0)&&ls()}}function ss(){return{now:()=>performance.now()}}function Yh(e=0){let t=e;return{now:()=>t,set:a=>{t=a},advance:a=>{t+=a}}}function us(e){let t=0,a=()=>{e.frame(),t=requestAnimationFrame(a)},r=()=>{t&&=(cancelAnimationFrame(t),0)};return{start(){!e.supportsRaf||t||(e.onStart(),t=requestAnimationFrame(a))},stop(){r(),e.settle()},settle(){e.settle()},dispose(){r(),e.teardown()}}}function cs(){return{lastRenderMs:0}}function fs(e,t,a){if(!(t>0))return!0;let r=1e3/t;return a-e.lastRenderMs<r-1?!1:(e.lastRenderMs+=r,a-e.lastRenderMs>=r&&(e.lastRenderMs=a),!0)}var ds={alpha:!0,premultipliedAlpha:!0,antialias:!1,depth:!1,stencil:!1,preserveDrawingBuffer:!1,powerPreference:"high-performance"};function hs(){return typeof window>"u"||!("matchMedia"in window)?!1:window.matchMedia("(color-gamut: p3)").matches}function ps(e){let t=e.getContext("webgl2",ds);if(!t)throw Error("WebGL2 is required but not available");t.getExtension("EXT_color_buffer_float");let a=!1;if(hs()){let n=t;"drawingBufferColorSpace"in t&&(n.drawingBufferColorSpace="display-p3"),"unpackColorSpace"in t&&(n.unpackColorSpace="display-p3"),a=(n.drawingBufferColorSpace??"srgb")==="display-p3"}let r=t.getParameter(t.MAX_TEXTURE_SIZE);return{gl:t,isP3:a,maxTextureSize:r}}function ms(e,t){let a=null,r=null;return{acquireContext(){return ps(e)},getDpr(){return t===void 0?((typeof window<"u"?window.devicePixelRatio:1)??1)*(e.currentCSSZoom??1):t},setDpr(n){t=n},applyOutputSize(n,o){e.width!==n&&(e.width=n),e.height!==o&&(e.height=o)},attachContextLossListeners(n,o){a=n,r=o,e.addEventListener("webglcontextlost",n,!1),e.addEventListener("webglcontextrestored",o,!1)},detachContextLossListeners(){a&&e.removeEventListener("webglcontextlost",a),r&&e.removeEventListener("webglcontextrestored",r),a=null,r=null},supportsRaf:!0}}function gs(e,t){let a=t;return{acquireContext(){return e},getDpr(){return a},setDpr(r){a=r},applyOutputSize(){},attachContextLossListeners(){},detachContextLossListeners(){},supportsRaf:!1}}function Pn(e,t,a){let r=e.createShader(t);if(!r)throw Error("Failed to create shader");if(e.shaderSource(r,a),e.compileShader(r),!e.getShaderParameter(r,e.COMPILE_STATUS)){let n=e.getShaderInfoLog(r);e.deleteShader(r);let o=t===e.VERTEX_SHADER?"vertex":"fragment";throw Error(`Shader compile failed (${o}):
${n??"(no log)"}`)}return r}function V(e,t,a){let r=e.createProgram();if(!r)throw Error("Failed to create program");let n=Pn(e,e.VERTEX_SHADER,t),o=Pn(e,e.FRAGMENT_SHADER,a);if(e.attachShader(r,n),e.attachShader(r,o),e.linkProgram(r),e.deleteShader(n),e.deleteShader(o),!e.getProgramParameter(r,e.LINK_STATUS)){let l=e.getProgramInfoLog(r);throw e.deleteProgram(r),Error(`Program link failed:
${l??"(no log)"}`)}return r}function Cn(e){let t=e.createVertexArray();if(!t)throw Error("Failed to create VAO");return{draw(){e.bindVertexArray(t),e.drawArrays(e.TRIANGLES,0,3),e.bindVertexArray(null)},dispose(){e.deleteVertexArray(t)}}}function vs(e,t){let a=Math.max(e.width,e.height);if(a<=t)return{width:Math.max(1,Math.round(e.width)),height:Math.max(1,Math.round(e.height))};let r=t/a;return{width:Math.max(1,Math.round(e.width*r)),height:Math.max(1,Math.round(e.height*r))}}function xs(e,t,a,r){return vs({width:e*a,height:t*a},r)}function bs(e,t){return{width:Math.max(1,Math.floor(e.width*t)),height:Math.max(1,Math.floor(e.height*t))}}function Ss(e,t,a,r){return{width:Math.max(1,Math.min(e.width,Math.ceil(t*r))),height:Math.max(1,Math.min(e.height,Math.ceil(a*r)))}}var ys=`#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uField;
uniform vec2 uGridCount;   // cols, rows
out vec4 finalColor;
const int TAPS = 4;
void main() {
  vec2 cell = floor(vUv * uGridCount);
  vec2 cellUv0 = cell / uGridCount;
  vec2 cellSpan = 1.0 / uGridCount;
  float sum = 0.0;
  for (int y = 0; y < TAPS; y++) {
    for (int x = 0; x < TAPS; x++) {
      vec2 t = (vec2(float(x), float(y)) + 0.5) / float(TAPS);
      sum += texture(uField, cellUv0 + t * cellSpan).r;
    }
  }
  finalColor = vec4(vec3(sum / float(TAPS * TAPS)), 1.0);
}
`,Ms=[];function ws(){return Ms}function li(e,t,a,r,n,o){e.bindTexture(e.TEXTURE_2D,t);let l=o?e.RGBA32F:n?e.RGBA16F:e.RGBA8,i=o?e.FLOAT:n?e.HALF_FLOAT:e.UNSIGNED_BYTE;e.texImage2D(e.TEXTURE_2D,0,l,a,r,0,e.RGBA,i,null)}function rt(e,t,a,r={}){let n=e.createTexture(),o=e.createFramebuffer();if(!n||!o)throw n&&e.deleteTexture(n),o&&e.deleteFramebuffer(o),Error("Failed to create render target");e.bindTexture(e.TEXTURE_2D,n);let l=r.linear?e.LINEAR:e.NEAREST;e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,l),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,l),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),li(e,n,t,a,!!r.float,!!r.float32),e.bindFramebuffer(e.FRAMEBUFFER,o),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,n,0);let i=e.checkFramebufferStatus(e.FRAMEBUFFER);if(e.bindFramebuffer(e.FRAMEBUFFER,null),i!==e.FRAMEBUFFER_COMPLETE)throw Error(`Framebuffer incomplete: 0x${i.toString(16)}`);return{fbo:o,texture:n,width:t,height:a,float:!!r.float,float32:!!r.float32}}function ba(e,t,a,r){t.width===a&&t.height===r||(li(e,t.texture,a,r,t.float??!1,t.float32??!1),t.width=a,t.height=r)}function Ye(e,t){e.deleteFramebuffer(t.fbo),e.deleteTexture(t.texture)}function X(e,t){e.bindFramebuffer(e.FRAMEBUFFER,t?t.fbo:null),t&&(e.viewport(0,0,t.width,t.height),t.width,t.height,void 0)}function xr(e){let t=e.createFramebuffer();if(!t)throw Error("Failed to create MRT framebuffer");return{fbo:t,dispose(){e.deleteFramebuffer(t)}}}function Lr(e,t,a){e.bindFramebuffer(e.FRAMEBUFFER,t.fbo);let r=[];for(let o=0;o<a.length;o++){let l=e.COLOR_ATTACHMENT0+o;e.framebufferTexture2D(e.FRAMEBUFFER,l,e.TEXTURE_2D,a[o].texture,0),r.push(l)}e.drawBuffers(r);let n=e.checkFramebufferStatus(e.FRAMEBUFFER);if(n!==e.FRAMEBUFFER_COMPLETE)throw Error(`MRT framebuffer incomplete: 0x${n.toString(16)}`);e.viewport(0,0,a[0].width,a[0].height);for(let o of a)o.width,o.height}var Q=`#version 300 es
precision highp float;
out vec2 vUv;
void main() {
  // Fullscreen triangle from gl_VertexID (0,1,2)
  vec2 p = vec2((gl_VertexID == 2) ? 3.0 : -1.0, (gl_VertexID == 1) ? 3.0 : -1.0);
  vUv = (p + 1.0) * 0.5;
  gl_Position = vec4(p, 0.0, 1.0);
}
`,Ps=`#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uSource;
uniform vec4 uSrcRect;        // u0,v0,u1,v1
uniform vec2 uTexel;          // 1/sourceW, 1/sourceH
uniform vec3 uBg;             // background rgb 0..1
uniform float uBlur, uSharpen;
uniform float uBlack, uWhite, uGamma, uExposure, uContrast, uBrightThresh;
uniform float uInvert, uPosterize, uNoise;
uniform sampler2D uWater;     // rg = height, velocity; unused while uWaterGain is 0
uniform float uWaterGain;
uniform vec2 uWaterTexel;     // 1/simW, 1/simH
out vec4 finalColor;

vec3 sampleBox(vec2 uv, float radius) {
  int r = int(radius + 0.5);
  if (r <= 0) return texture(uSource, uv).rgb;
  vec3 sum = vec3(0.0); float n = 0.0;
  for (int y = -4; y <= 4; y++) {
    if (y < -r || y > r) continue;
    for (int x = -4; x <= 4; x++) {
      if (x < -r || x > r) continue;
      sum += texture(uSource, uv + vec2(float(x), float(y)) * uTexel).rgb; n += 1.0;
    }
  }
  return sum / max(1.0, n);
}
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

void main() {
  vec2 uv = mix(uSrcRect.xy, uSrcRect.zw, vUv);
  // Displace the source along the water gradient, so surface motion drags the
  // texture itself rather than only painting highlights over it.
  if (uWaterGain > 0.0) {
    vec2 rspan = uSrcRect.zw - uSrcRect.xy;
    float phL = texture(uWater, vUv - vec2(uWaterTexel.x, 0.0)).r;
    float phR = texture(uWater, vUv + vec2(uWaterTexel.x, 0.0)).r;
    float phT = texture(uWater, vUv + vec2(0.0, uWaterTexel.y)).r;
    float phB = texture(uWater, vUv - vec2(0.0, uWaterTexel.y)).r;
    vec2 pgrad = vec2(phR - phL, phT - phB);
    vec2 poff = clamp(pgrad * 0.045 * rspan, -0.015 * rspan, 0.015 * rspan);
    uv = clamp(uv + poff, uSrcRect.xy, uSrcRect.zw);
  }
  vec3 col;
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    col = uBg;
  } else {
    col = sampleBox(uv, uBlur);
    if (uSharpen > 0.0) col = col + (col - sampleBox(uv, max(1.0, uBlur))) * uSharpen;
  }
  // levels
  col = clamp((col - uBlack) / max(1e-4, uWhite - uBlack), 0.0, 1.0);
  col = pow(col, vec3(uGamma));
  col *= exp2(uExposure);
  col = (col - 0.5) * uContrast + 0.5;
  col += vec3(uBrightThresh);
  if (uInvert > 0.5) col = 1.0 - col;
  if (uPosterize >= 2.0) col = floor(col * uPosterize) / max(1.0, uPosterize - 1.0);
  if (uNoise > 0.0) col += vec3((hash(vUv * 4096.0) - 0.5) * uNoise);
  col = clamp(col, 0.0, 1.0);
  float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
  // Signed height brightens crests and darkens troughs. The soft-knee keeps
  // large amplitudes from blowing out; troughs are scaled down (0.65) so the
  // stripes never collapse to black under a fast stroke.
  float wH = texture(uWater, vUv).r;
  float wC = wH / (1.0 + abs(wH) * 0.5);
  float wT = sign(wC) * max(0.0, abs(wC) - 0.1) * 1.25;
  float wS = (wT > 0.0 ? wT : wT * 0.65) * uWaterGain;
  luma = clamp(luma * (1.0 + wS) + wS * 0.15, 0.0, 1.0);
  finalColor = vec4(vec3(luma), 1.0);
}
`;function Ce(e){return[(e>>16&255)/255,(e>>8&255)/255,(e&255)/255]}function Cs(e,t,a){return(.2126*e+.7152*t+.0722*a)/255}function Ts(e,t,a){let r=e/255,n=t/255,o=a/255,l=Math.max(r,n,o);return l<=0?0:(l-Math.min(r,n,o))/l}function Rs(e,t){let a=V(e,Q,Ps),r=o=>e.getUniformLocation(a,o),n={src:r("uSource"),rect:r("uSrcRect"),texel:r("uTexel"),bg:r("uBg"),blur:r("uBlur"),sharpen:r("uSharpen"),black:r("uBlack"),white:r("uWhite"),gamma:r("uGamma"),exposure:r("uExposure"),contrast:r("uContrast"),brightThresh:r("uBrightThresh"),invert:r("uInvert"),posterize:r("uPosterize"),noise:r("uNoise"),water:r("uWater"),waterGain:r("uWaterGain"),waterTexel:r("uWaterTexel")};return{render(o,l,i){X(e,o),e.useProgram(a),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,l),e.uniform1i(n.src,0),e.uniform4f(n.rect,i.srcRect.u0,i.srcRect.v0,i.srcRect.u1,i.srcRect.v1),e.uniform2f(n.texel,i.sourceTexelW,i.sourceTexelH);let s=i.adjustments;e.uniform3f(n.bg,...Ce(i.background)),e.uniform1f(n.blur,s.blurRadius),e.uniform1f(n.sharpen,s.sharpenAmount),e.uniform1f(n.black,s.blackPoint),e.uniform1f(n.white,s.whitePoint),e.uniform1f(n.gamma,s.gamma),e.uniform1f(n.exposure,s.exposure),e.uniform1f(n.contrast,s.contrast),e.uniform1f(n.brightThresh,s.brightness+s.thresholdBias),e.uniform1f(n.invert,+!!s.invert),e.uniform1f(n.posterize,s.posterizeLevels),e.uniform1f(n.noise,s.noiseAmount),e.activeTexture(e.TEXTURE1),e.bindTexture(e.TEXTURE_2D,i.water?i.water.texture:l),e.uniform1i(n.water,1),e.uniform1f(n.waterGain,i.water?i.water.gain:0),e.uniform2f(n.waterTexel,i.water?i.water.texelX:1,i.water?i.water.texelY:1),e.activeTexture(e.TEXTURE0),t.draw()},dispose(){e.deleteProgram(a)}}}var si=`
uniform sampler2D uSource;
uniform vec4 uSrcRect;        // u0,v0,u1,v1
uniform vec2 uTexel;          // 1/sourceW, 1/sourceH
uniform vec3 uBg;             // out-of-rect fill rgb 0..1
uniform vec3 uColorBg;        // distance reference background rgb 0..1
uniform float uBlur, uSharpen;
uniform float uBlack, uWhite, uGamma, uExposure, uContrast, uBrightThresh;
uniform float uInvert, uPosterize, uNoise;

vec3 sampleBox(vec2 uv, float radius) {
  int r = int(radius + 0.5);
  if (r <= 0) return texture(uSource, uv).rgb;
  vec3 sum = vec3(0.0); float n = 0.0;
  for (int y = -4; y <= 4; y++) {
    if (y < -r || y > r) continue;
    for (int x = -4; x <= 4; x++) {
      if (x < -r || x > r) continue;
      sum += texture(uSource, uv + vec2(float(x), float(y)) * uTexel).rgb; n += 1.0;
    }
  }
  return sum / max(1.0, n);
}
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

vec3 adjustedColor(vec2 vUv) {
  vec2 uv = mix(uSrcRect.xy, uSrcRect.zw, vUv);
  vec3 col;
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    col = uBg;
  } else {
    col = sampleBox(uv, uBlur);
    if (uSharpen > 0.0) col = col + (col - sampleBox(uv, max(1.0, uBlur))) * uSharpen;
  }
  col = clamp((col - uBlack) / max(1e-4, uWhite - uBlack), 0.0, 1.0);
  col = pow(col, vec3(uGamma));
  col *= exp2(uExposure);
  col = (col - 0.5) * uContrast + 0.5;
  col += vec3(uBrightThresh);
  if (uInvert > 0.5) col = 1.0 - col;
  if (uPosterize >= 2.0) col = floor(col * uPosterize) / max(1.0, uPosterize - 1.0);
  if (uNoise > 0.0) col += vec3((hash(vUv * 4096.0) - 0.5) * uNoise);
  col = clamp(col, 0.0, 1.0);
  return col;
}
`,Es=`#version 300 es
precision highp float;
in vec2 vUv;
uniform float uMaxColorDist;  // largest in-texture distance from uColorBg (0..sqrt(3))
layout(location=0) out vec4 oField;
layout(location=1) out vec4 oColor;
${si}
void main() {
  vec3 col = adjustedColor(vUv);
  float presence = min(1.0, length(col - uColorBg) / max(uMaxColorDist, 1e-4));
  oField = vec4(vec3(presence), 1.0);
  oColor = vec4(col, presence);
}
`;function As(e,t){let a=V(e,Q,Es),r=o=>e.getUniformLocation(a,o),n={src:r("uSource"),rect:r("uSrcRect"),texel:r("uTexel"),bg:r("uBg"),colorBg:r("uColorBg"),maxColorDist:r("uMaxColorDist"),blur:r("uBlur"),sharpen:r("uSharpen"),black:r("uBlack"),white:r("uWhite"),gamma:r("uGamma"),exposure:r("uExposure"),contrast:r("uContrast"),brightThresh:r("uBrightThresh"),invert:r("uInvert"),posterize:r("uPosterize"),noise:r("uNoise")};return{render(o,l,i,s,u){Lr(e,o,[l,i]),e.useProgram(a),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,s),e.uniform1i(n.src,0),e.uniform4f(n.rect,u.srcRect.u0,u.srcRect.v0,u.srcRect.u1,u.srcRect.v1),e.uniform2f(n.texel,u.sourceTexelW,u.sourceTexelH);let f=u.adjustments;e.uniform3f(n.bg,...Ce(u.background)),e.uniform3f(n.colorBg,...Ce(u.colorBackground)),e.uniform1f(n.maxColorDist,u.maxColorDist),e.uniform1f(n.blur,f.blurRadius),e.uniform1f(n.sharpen,f.sharpenAmount),e.uniform1f(n.black,f.blackPoint),e.uniform1f(n.white,f.whitePoint),e.uniform1f(n.gamma,f.gamma),e.uniform1f(n.exposure,f.exposure),e.uniform1f(n.contrast,f.contrast),e.uniform1f(n.brightThresh,f.brightness+f.thresholdBias),e.uniform1f(n.invert,+!!f.invert),e.uniform1f(n.posterize,f.posterizeLevels),e.uniform1f(n.noise,f.noiseAmount),t.draw()},dispose(){e.deleteProgram(a)}}}var ui=`
uniform float uEdgeMaskEnabled;
uniform float uEdgeMaskStart;
uniform float uEdgeMaskEnd;
uniform float uEdgeMaskPower;
uniform vec4 uEdgeMaskSides;
uniform float uContourFieldEnabled;
uniform sampler2D uContourField;
uniform float uContourMinCssPx;

float edgeMaskRamp(float inset, float side) {
  float t = clamp((inset - uEdgeMaskStart) / (uEdgeMaskEnd - uEdgeMaskStart), 0.0, 1.0);
  return mix(1.0, pow(t, uEdgeMaskPower), side);
}

float contourSideEnabled(float side) {
  if (side < 0.5) return uEdgeMaskSides.x;
  if (side < 1.5) return uEdgeMaskSides.y;
  if (side < 2.5) return uEdgeMaskSides.z;
  return uEdgeMaskSides.w;
}

float edgeMaskAlpha(vec2 uv) {
  if (uContourFieldEnabled > 0.5) {
    vec4 contour = texture(uContourField, uv);
    if (contour.r < 0.5) return 0.0;
    if (uEdgeMaskEnabled < 0.5) return 1.0;
    return edgeMaskRamp(contour.g / max(uContourMinCssPx, 1.0), contourSideEnabled(contour.b));
  }
  if (uEdgeMaskEnabled < 0.5) return 1.0;
  vec4 insets = vec4(uv.x, 1.0 - uv.x, uv.y, 1.0 - uv.y);
  return
    edgeMaskRamp(insets.x, uEdgeMaskSides.x) *
    edgeMaskRamp(insets.y, uEdgeMaskSides.y) *
    edgeMaskRamp(insets.z, uEdgeMaskSides.z) *
    edgeMaskRamp(insets.w, uEdgeMaskSides.w);
}
`,ks=`#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uField;
${ui}
out vec4 finalColor;
void main() {
  finalColor = vec4(texture(uField, vUv).rgb, 1.0) * edgeMaskAlpha(vUv);
}
`;function Ds(e,t){let a=V(e,Q,ks),r=e.getUniformLocation(a,"uField"),n=e.getUniformLocation(a,"uEdgeMaskEnabled"),o=e.getUniformLocation(a,"uEdgeMaskStart"),l=e.getUniformLocation(a,"uEdgeMaskEnd"),i=e.getUniformLocation(a,"uEdgeMaskPower"),s=e.getUniformLocation(a,"uEdgeMaskSides"),u=e.getUniformLocation(a,"uContourFieldEnabled"),f=e.getUniformLocation(a,"uContourField"),c=e.getUniformLocation(a,"uContourMinCssPx");return{render(m,g,b,S,v,M,y,x=0,T=0){e.bindFramebuffer(e.FRAMEBUFFER,null),e.viewport(x,T,g,b),e.useProgram(a),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,m),e.uniform1i(r,0),e.uniform1f(n,+!!v),e.uniform1f(o,S.start),e.uniform1f(l,S.end),e.uniform1f(i,S.power),e.uniform4f(s,+!!S.sides.left,+!!S.sides.right,+!!S.sides.bottom,+!!S.sides.top),e.activeTexture(e.TEXTURE1),e.bindTexture(e.TEXTURE_2D,M),e.uniform1i(f,1),e.uniform1f(u,+!!M),e.uniform1f(c,y),t.draw()},dispose(){e.deleteProgram(a)}}}function Fs(e,t){let a=V(e,Q,ys),r=e.getUniformLocation(a,"uField"),n=e.getUniformLocation(a,"uGridCount");return{render(o,l,i,s){X(e,o),e.useProgram(a),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,l),e.uniform1i(r,0),e.uniform2f(n,i,s),t.draw()},dispose(){e.deleteProgram(a)}}}var Ls=`#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uField;
uniform vec2 uGridCount;   // cols, rows
out vec4 finalColor;
const int TAPS = 4;
void main() {
  vec2 cell = floor(vUv * uGridCount);
  vec2 cellUv0 = cell / uGridCount;
  vec2 cellSpan = 1.0 / uGridCount;
  vec4 sum = vec4(0.0);
  for (int y = 0; y < TAPS; y++) {
    for (int x = 0; x < TAPS; x++) {
      vec2 t = (vec2(float(x), float(y)) + 0.5) / float(TAPS);
      sum += texture(uField, cellUv0 + t * cellSpan);
    }
  }
  finalColor = sum / float(TAPS * TAPS);
}
`;function Us(e,t){let a=V(e,Q,Ls),r=e.getUniformLocation(a,"uField"),n=e.getUniformLocation(a,"uGridCount");return{render(o,l,i,s){X(e,o),e.useProgram(a),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,l),e.uniform1i(r,0),e.uniform2f(n,i,s),t.draw()},dispose(){e.deleteProgram(a)}}}var Bs=`#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uField;
uniform vec2 uGridCount;
uniform float uRevealMode;
uniform vec2 uOrigin;
uniform float uMaxDist;
uniform float uProgress;
uniform float uSoftness;
uniform float uWaviness;
uniform float uBandRamp;
out vec4 finalColor;

highp float cellNoise(highp float col, highp float row) {
  highp float px = floor(col / 0.1);
  highp float py = floor(row / 0.1);
  highp float p3x = fract(px * 0.1031);
  highp float p3y = fract(py * 0.103);
  highp float p3z = fract(px * 0.0973);
  highp float d = p3x * (p3y + 33.33) + p3y * (p3z + 33.33) + p3z * (p3x + 33.33);
  p3x += d;
  p3y += d;
  p3z += d;
  return fract((p3x + p3y) * p3z);
}

void main() {
  float v = texture(uField, vUv).r;
  float mask = 1.0;
  if (uRevealMode > 0.5) {
    vec2 cell = floor(vUv * uGridCount);
    vec2 cellCenterUv = (cell + 0.5) / uGridCount;
    float dist = length(cellCenterUv - uOrigin) / max(uMaxDist, 1e-4);
    float n = (cellNoise(cell.x, cell.y) - 0.5) * uWaviness;
    mask = smoothstep(dist - max(uSoftness, 0.0), dist + max(uSoftness, 0.0) + uBandRamp, max(uProgress, 0.0) + n);
  }
  finalColor = vec4(vec3(v * mask), 1.0);
}
`;function Is(e,t){let a=V(e,Q,Bs),r=o=>e.getUniformLocation(a,o),n={field:r("uField"),grid:r("uGridCount"),mode:r("uRevealMode"),origin:r("uOrigin"),maxDist:r("uMaxDist"),progress:r("uProgress"),softness:r("uSoftness"),waviness:r("uWaviness"),bandRamp:r("uBandRamp")};return{render(o,l,i,s,u){X(e,o),e.useProgram(a),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,l),e.uniform1i(n.field,0),e.uniform2f(n.grid,i,s),e.uniform1f(n.mode,u.revealMode),e.uniform2f(n.origin,u.origin[0],u.origin[1]),e.uniform1f(n.maxDist,u.maxDist),e.uniform1f(n.progress,u.progress),e.uniform1f(n.softness,u.softness),e.uniform1f(n.waviness,u.waviness),e.uniform1f(n.bandRamp,u.bandRamp),t.draw()},dispose(){e.deleteProgram(a)}}}var _s=`#version 300 es
precision highp float;
uniform vec2 uBlockGrid;
uniform float uProgress;
uniform float uSpread;
uniform float uFlight;
uniform float uSpawnDist;
uniform vec2 uScatter;
uniform float uAngleJitter;
uniform vec2 uSigmaUv;
uniform float uBlurStart;
out vec2 vSampleUv;
flat out highp float vBlurAmount;
flat out vec2 vRectMin;
flat out vec2 vRectMax;

highp float fract1(highp float v) {
  return v - floor(v);
}

highp float cellNoise(highp float col, highp float row, highp float scale) {
  highp float s = max(0.1, scale);
  highp float px = floor(col / s);
  highp float py = floor(row / s);
  highp float p3x = fract1(px * 0.1031);
  highp float p3y = fract1(py * 0.103);
  highp float p3z = fract1(px * 0.0973);
  highp float d = p3x * (p3y + 33.33) + p3y * (p3z + 33.33) + p3z * (p3x + 33.33);
  p3x += d;
  p3y += d;
  p3z += d;
  return fract1((p3x + p3y) * p3z);
}

highp float bezierAxis(highp float a1, highp float a2, highp float s) {
  highp float c = 3.0 * a1;
  highp float b = 3.0 * (a2 - a1) - c;
  highp float a = 1.0 - c - b;
  return ((a * s + b) * s + c) * s;
}

highp float bezierSlope(highp float a1, highp float a2, highp float s) {
  highp float c = 3.0 * a1;
  highp float b = 3.0 * (a2 - a1) - c;
  highp float a = 1.0 - c - b;
  return (3.0 * a * s + 2.0 * b) * s + c;
}

highp float cubicBezier(highp float t, highp float x1, highp float y1, highp float x2, highp float y2) {
  highp float s = t;
  for (int i = 0; i < 5; i++) {
    highp float dx = bezierAxis(x1, x2, s) - t;
    highp float d = bezierSlope(x1, x2, s);
    if (abs(d) < 0.00001) break;
    s = clamp(s - dx / d, 0.0, 1.0);
  }
  return bezierAxis(y1, y2, s);
}

highp float orderNorm(highp float col, highp float row, highp float cols, highp float rows) {
  highp float cx = cols <= 1.0 ? 0.5 : (col + 0.5) / cols;
  highp float cy = rows <= 1.0 ? 0.5 : (row + 0.5) / rows;
  return length(vec2(cx - 0.5, cy - 0.5)) / 0.70710678;
}

void main() {
  highp float bCols = uBlockGrid.x;
  highp float instance = float(gl_InstanceID);
  highp float bx = mod(instance, bCols);
  highp float by = floor(instance / bCols);

  vec2 uv0 = vec2(bx / uBlockGrid.x, by / uBlockGrid.y);
  vec2 uv1 = vec2(min(1.0, (bx + 1.0) / uBlockGrid.x), min(1.0, (by + 1.0) / uBlockGrid.y));
  vec2 blockCenterUv = 0.5 * (uv0 + uv1);
  vec2 halfExt = 0.5 * (uv1 - uv0);

  highp float orderKey = orderNorm(bx, by, uBlockGrid.x, uBlockGrid.y);
  highp float f = clamp((uProgress - uSpread * orderKey) / max(uFlight, 1e-4), 0.0, 1.0);

  int vid = gl_VertexID;
  highp float qx = (vid == 1 || vid == 2 || vid == 4) ? 1.0 : 0.0;
  highp float qy = (vid == 2 || vid == 4 || vid == 5) ? 1.0 : 0.0;

  if (f <= 0.0) {
    vSampleUv = blockCenterUv;
    vBlurAmount = 1.0;
    vRectMin = uv0;
    vRectMax = uv1;
    gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
    return;
  }

  highp float dL = blockCenterUv.x;
  highp float dR = 1.0 - blockCenterUv.x;
  highp float dT = blockCenterUv.y;
  highp float dB = 1.0 - blockCenterUv.y;
  vec2 edgeDir;
  highp float edgeDistTo;
  if (dL <= dR && dL <= dT && dL <= dB) { edgeDir = vec2(-1.0, 0.0); edgeDistTo = dL; }
  else if (dR <= dT && dR <= dB) { edgeDir = vec2(1.0, 0.0); edgeDistTo = dR; }
  else if (dT <= dB) { edgeDir = vec2(0.0, -1.0); edgeDistTo = dT; }
  else { edgeDir = vec2(0.0, 1.0); edgeDistTo = dB; }

  highp float ang = (cellNoise(bx + 17.0, by + 23.0, 1.0) - 0.5) * 2.0 * uAngleJitter;
  highp float ca = cos(ang);
  highp float sa = sin(ang);
  edgeDir = vec2(edgeDir.x * ca - edgeDir.y * sa, edgeDir.x * sa + edgeDir.y * ca);

  highp float offMargin = 0.06 + 0.16 * cellNoise(bx, by, 1.0);
  vec2 perp = vec2(-edgeDir.y, edgeDir.x);
  highp float spr = (cellNoise(by + 11.0, bx + 5.0, 1.0) - 0.5) * 0.18;
  vec2 spawnOffset = edgeDir * (edgeDistTo + offMargin) + perp * spr;
  vec2 jitter = vec2(cellNoise(bx + 3.0, by + 7.0, 1.0), cellNoise(bx + 31.0, by + 13.0, 1.0)) - 0.5;
  spawnOffset += jitter * 2.0 * uScatter;

  highp float ease = cubicBezier(f, 0.25, 0.1, 0.25, 1.0);
  vec2 offset = (1.0 - ease) * spawnOffset;

  highp float fBlur = clamp((f - uBlurStart) / max(1.0 - uBlurStart, 1e-4), 0.0, 1.0);
  highp float blurAmount = 1.0 - cubicBezier(fBlur, 0.25, 0.1, 0.25, 1.0);
  vec2 ext = blurAmount * uSigmaUv * 2.0;
  vec2 cornerUv = vec2(mix(uv0.x - ext.x, uv1.x + ext.x, qx), mix(uv0.y - ext.y, uv1.y + ext.y, qy));
  vSampleUv = cornerUv;
  vBlurAmount = blurAmount;
  vRectMin = uv0;
  vRectMax = uv1;

  vec2 posUv = cornerUv + offset;
  gl_Position = vec4(posUv * 2.0 - 1.0, 0.0, 1.0);
}
`,Ws=`#version 300 es
precision highp float;
in vec2 vSampleUv;
flat in highp float vBlurAmount;
flat in vec2 vRectMin;
flat in vec2 vRectMax;
uniform sampler2D uField;
uniform sampler2D uBlurQuarter;
uniform sampler2D uBlurHalf;
uniform sampler2D uBlurFull;
uniform vec2 uSigmaUv;
out vec4 finalColor;

void main() {
  float s = vBlurAmount;
  vec2 suv = clamp(vSampleUv, vRectMin, vRectMax);
  float v;
  if (s <= 0.0) {
    v = texture(uField, suv).r;
  } else if (s <= 0.25) {
    v = mix(texture(uField, suv).r, texture(uBlurQuarter, suv).r, s * 4.0);
  } else if (s <= 0.5) {
    v = mix(texture(uBlurQuarter, suv).r, texture(uBlurHalf, suv).r, (s - 0.25) * 4.0);
  } else {
    v = mix(texture(uBlurHalf, suv).r, texture(uBlurFull, suv).r, (s - 0.5) * 2.0);
  }
  vec2 r = max(s * uSigmaUv, vec2(1e-6));
  float cov = smoothstep(vRectMin.x - r.x, vRectMin.x + r.x, vSampleUv.x) *
    (1.0 - smoothstep(vRectMax.x - r.x, vRectMax.x + r.x, vSampleUv.x)) *
    smoothstep(vRectMin.y - r.y, vRectMin.y + r.y, vSampleUv.y) *
    (1.0 - smoothstep(vRectMax.y - r.y, vRectMax.y + r.y, vSampleUv.y));
  finalColor = vec4(vec3(v * cov), 1.0);
}
`;function Gs(e){let t=V(e,_s,Ws),a=e.createVertexArray();if(!a)throw Error("Failed to create VAO");let r=o=>e.getUniformLocation(t,o),n={field:r("uField"),blurQuarter:r("uBlurQuarter"),blurHalf:r("uBlurHalf"),blurFull:r("uBlurFull"),blockGrid:r("uBlockGrid"),progress:r("uProgress"),spread:r("uSpread"),flight:r("uFlight"),spawnDist:r("uSpawnDist"),scatter:r("uScatter"),angleJitter:r("uAngleJitter"),sigmaUv:r("uSigmaUv"),blurStart:r("uBlurStart")};return{render(o,l,i,s,u,f){X(e,o),e.clearColor(0,0,0,1),e.clear(e.COLOR_BUFFER_BIT),e.useProgram(t),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,l),e.uniform1i(n.field,0),e.activeTexture(e.TEXTURE1),e.bindTexture(e.TEXTURE_2D,i),e.uniform1i(n.blurQuarter,1),e.activeTexture(e.TEXTURE2),e.bindTexture(e.TEXTURE_2D,s),e.uniform1i(n.blurHalf,2),e.activeTexture(e.TEXTURE3),e.bindTexture(e.TEXTURE_2D,u),e.uniform1i(n.blurFull,3),e.activeTexture(e.TEXTURE0),e.uniform2f(n.blockGrid,f.blockCols,f.blockRows),e.uniform1f(n.progress,f.progress),e.uniform1f(n.spread,f.spread),e.uniform1f(n.flight,f.flight),e.uniform1f(n.spawnDist,f.spawnDist),e.uniform2f(n.scatter,f.scatter[0],f.scatter[1]),e.uniform1f(n.angleJitter,f.angleJitter),e.uniform2f(n.sigmaUv,f.sigmaUv[0],f.sigmaUv[1]),e.uniform1f(n.blurStart,f.blurStart),e.enable(e.BLEND),e.blendEquation(e.MAX),e.bindVertexArray(a),e.drawArraysInstanced(e.TRIANGLES,0,6,f.blockCols*f.blockRows),e.bindVertexArray(null),e.blendEquation(e.FUNC_ADD),e.disable(e.BLEND)},dispose(){e.deleteProgram(t),e.deleteVertexArray(a)}}}var Os=`#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uField;
uniform int uMode;
uniform float uProgress;
uniform float uSpread;
uniform float uFlight;
uniform float uIntensity;
uniform float uDetail;
uniform float uGlow;
out vec4 finalColor;

highp float vhash(vec2 q) {
  return fract(sin(dot(q, vec2(127.1, 311.7))) * 43758.5453123);
}

highp float vnoise(vec2 q) {
  vec2 i = floor(q);
  vec2 fr = fract(q);
  vec2 u = fr * fr * (3.0 - 2.0 * fr);
  highp float a = vhash(i);
  highp float b = vhash(i + vec2(1.0, 0.0));
  highp float c = vhash(i + vec2(0.0, 1.0));
  highp float d = vhash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

highp float fbm2(vec2 q) {
  return 0.62 * vnoise(q) + 0.38 * vnoise(q * 2.73 + 13.7);
}

void main() {
  highp float p = max(uProgress, 0.0);
  highp float freq = mix(2.0, 10.0, uDetail);

  highp float n;
  if (uMode == 0) {
    highp float n0 = fbm2(vUv * mix(4.0, 14.0, uDetail) + 7.3);
    highp float n1 = vhash(floor(vUv * mix(8.0, 26.0, uDetail)) * 0.173 + 3.7);
    n = clamp(mix(n0, n1, 0.55), 0.0, 1.0);
  } else {
    highp float rows = mix(14.0, 60.0, uDetail);
    n = vhash(vec2(floor(vUv.y * rows) * 0.57, 12.3));
  }

  highp float f = clamp((p - uSpread * n) / max(uFlight, 1e-4), 0.0, 1.0);
  if (f >= 1.0) {
    finalColor = vec4(vec3(texture(uField, vUv).r), 1.0);
    return;
  }
  highp float ease = 1.0 - pow(1.0 - f, 3.0);

  if (uMode == 0) {
    highp float sOff = (fbm2(vUv * 5.0 + 21.7) - 0.5) * 0.24;
    highp float s = smoothstep(0.5 + sOff, 1.0, f);
    highp float settle = s * s * (3.0 - 2.0 * s);
    highp float decay = 1.0 - settle;
    highp float emerge = smoothstep(0.0, 0.22, f);
    vec2 flow = vec2(p * 0.9, -p * 0.6);
    vec2 q1 = vUv * freq + flow + 2.1;
    vec2 q2 = vUv * freq * 2.6 + flow * 1.8 + 17.3;
    highp float e = 0.09;
    vec2 c1 = vec2(fbm2(q1 + vec2(0.0, e)) - fbm2(q1 - vec2(0.0, e)), fbm2(q1 - vec2(e, 0.0)) - fbm2(q1 + vec2(e, 0.0))) / (2.0 * e);
    vec2 c2 = vec2(fbm2(q2 + vec2(0.0, e)) - fbm2(q2 - vec2(0.0, e)), fbm2(q2 - vec2(e, 0.0)) - fbm2(q2 + vec2(e, 0.0))) / (2.0 * e);
    vec2 curlV = c1 * 0.75 + c2 * 0.35;
    highp float vort = 0.55 + 0.9 * decay;
    vec2 disp = curlV * 0.09 * vort * uIntensity * decay;
    highp float acc = 0.0;
    for (int t = 0; t < 5; t++) {
      highp float w = 0.55 + 0.225 * float(t);
      acc += texture(uField, clamp(vUv + disp * w, 0.0, 1.0)).r;
    }
    highp float v = acc * 0.2;
    highp float gain = 1.0 + uGlow * 1.2 * min(1.0, length(disp) * 8.0) * decay + uGlow * 1.6 * emerge * (1.0 - emerge);
    finalColor = vec4(vec3(v * gain * emerge), 1.0);
    return;
  }

  if (uMode == 1) {
    highp float inten = smoothstep(0.0, 0.75, f);
    inten *= inten;
    highp float masterDecay = 1.0 - smoothstep(0.82, 0.95, f);
    highp float emerge = smoothstep(0.0, 0.1, f) * (0.45 + 0.55 * smoothstep(0.3, 0.9, f));
    highp float rows = mix(14.0, 60.0, uDetail);
    highp float rowC = floor(vUv.y * rows);
    highp float stp = floor(p * 46.0);
    highp float duty = mix(0.92, 0.3, inten);
    highp float act = step(duty, vhash(vec2(rowC * 0.53 + stp * 1.71, 6.1)));
    highp float h = vhash(vec2(rowC * 0.37 + stp * 1.13, 4.2));
    vec2 disp = vec2((h - 0.5) * (0.25 + 0.45 * inten), (vhash(vec2(rowC * 0.71 + stp * 1.31, 2.6)) - 0.5) * 0.05 * inten) * act * masterDecay * uIntensity;
    highp float acc = 0.0;
    for (int t = 0; t < 5; t++) {
      highp float w = 0.55 + 0.225 * float(t);
      acc += texture(uField, clamp(vUv + disp * w, 0.0, 1.0)).r;
    }
    highp float v = acc * 0.2;
    highp float white = smoothstep(0.78, 0.86, f) * (1.0 - smoothstep(0.88, 0.97, f));
    highp float gain = 1.0 + uGlow * 0.6 * act * inten * masterDecay + uGlow * 0.5 * inten * masterDecay * (vhash(vec2(stp, 3.7)) - 0.5) * 2.0;
    finalColor = vec4(vec3(v * max(gain, 0.0) * emerge + white * uGlow * 1.6), 1.0);
    return;
  }

  finalColor = vec4(vec3(texture(uField, vUv).r * smoothstep(0.0, 0.2, f)), 1.0);
}
`;function zs(e,t){let a=V(e,Q,Os),r=o=>e.getUniformLocation(a,o),n={field:r("uField"),mode:r("uMode"),progress:r("uProgress"),spread:r("uSpread"),flight:r("uFlight"),intensity:r("uIntensity"),detail:r("uDetail"),glow:r("uGlow")};return{render(o,l,i){X(e,o),e.useProgram(a),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,l),e.uniform1i(n.field,0),e.uniform1i(n.mode,i.mode),e.uniform1f(n.progress,i.progress),e.uniform1f(n.spread,i.spread),e.uniform1f(n.flight,i.flight),e.uniform1f(n.intensity,i.intensity),e.uniform1f(n.detail,i.detail),e.uniform1f(n.glow,i.glow),t.draw()},dispose(){e.deleteProgram(a)}}}var Hs=`#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uField;
uniform float uProgress;
uniform float uSpread;
uniform float uFlight;
uniform vec2 uGrid;
uniform float uGlow;
uniform float uAspect;
out vec4 finalColor;

highp uint pcg(highp uint v) {
  v = v * 747796405u + 2891336453u;
  highp uint s = ((v >> ((v >> 28) + 4u)) ^ v) * 277803737u;
  return (s >> 22) ^ s;
}

highp float hashLane(highp uint i, highp uint salt) {
  return float(pcg(i * 747796405u + salt)) * (1.0 / 4294967296.0);
}

void main() {
  highp float p = max(uProgress, 0.0);
  if (p >= uSpread * 1.12 + uFlight * 1.25) {
    finalColor = vec4(vec3(texture(uField, vUv).r), 1.0);
    return;
  }
  vec2 cid = floor(vUv * uGrid);
  highp uint cellIndex = uint(cid.y * uGrid.x + cid.x);
  vec2 cellCenter = (cid + 0.5) / uGrid;
  vec2 asp = vec2(uAspect, 1.0);
  highp float dn = length((cellCenter - 0.5) * asp) / (length(asp) * 0.5);
  highp float o = (dn * 0.7 + (hashLane(cellIndex, 1u) - 0.5) * 0.5 + 0.25) / 1.2;
  o = o < 0.5 ? sqrt(0.5 * o) : 1.0 - sqrt(0.5 * (1.0 - o));
  highp float blockV = texture(uField, cellCenter).r;
  highp float fullV = texture(uField, vUv).r;
  highp float accFrac = 0.0;
  highp float lastRaw = 0.0;
  for (uint k = 0u; k < 3u; k++) {
    highp float ok = o + float(k) * 0.04 + hashLane(cellIndex * 3u + k, 4u) * 0.02;
    highp float fr = (p - uSpread * ok) / max(uFlight, 1e-4);
    accFrac += step(1.0, fr) / 3.0;
    if (k == 2u) {
      lastRaw = fr;
    }
  }
  highp float refine = smoothstep(1.0, 1.2, lastRaw);
  highp float flash = step(1.0, lastRaw) * (1.0 - smoothstep(1.0, 1.1, lastRaw));
  highp float v = mix(blockV * accFrac, fullV, refine);
  finalColor = vec4(vec3(v * (1.0 + 0.3 * uGlow * flash)), 1.0);
}
`,Vs=`#version 300 es
precision highp float;
uniform float uProgress;
uniform float uSpread;
uniform float uFlight;
uniform vec2 uGrid;
uniform float uGlow;
uniform float uIntensity;
uniform float uSwirl;
uniform float uAspect;
uniform sampler2D uField;
out vec2 vQuad;
flat out highp float vVal;

highp uint pcg(highp uint v) {
  v = v * 747796405u + 2891336453u;
  highp uint s = ((v >> ((v >> 28) + 4u)) ^ v) * 277803737u;
  return (s >> 22) ^ s;
}

highp float hashLane(highp uint i, highp uint salt) {
  return float(pcg(i * 747796405u + salt)) * (1.0 / 4294967296.0);
}

vec2 vortexPos(vec2 sUv, vec2 tUv, vec2 asp, highp float total, highp float blend, highp float e) {
  vec2 straight = mix(sUv, tUv, e);
  if (blend <= 0.001) {
    return straight;
  }
  vec2 sv = (sUv - 0.5) * asp;
  vec2 tv = (tUv - 0.5) * asp;
  highp float rt = length(tv);
  highp float aT = rt > 1e-5 ? atan(tv.y, tv.x) : 0.0;
  highp float rMax = length(asp) * 0.5;
  highp float rStart = max(length(sv), rMax * 1.02);
  highp float ang = aT - total * (1.0 - e);
  highp float rr = mix(rStart, rt, e);
  vec2 spiral = 0.5 + (vec2(cos(ang), sin(ang)) * rr) / asp;
  return mix(straight, spiral, blend);
}

void main() {
  highp uint id = uint(gl_InstanceID);
  highp uint cellIndex = id / 3u;
  highp uint k = id - cellIndex * 3u;
  highp float gx = uGrid.x;
  vec2 cell = vec2(mod(float(cellIndex), gx), floor(float(cellIndex) / gx));
  vec2 targetUv = (cell + 0.5) / uGrid;
  vec2 asp = vec2(uAspect, 1.0);
  highp float dn = length((targetUv - 0.5) * asp) / (length(asp) * 0.5);
  highp float o = (dn * 0.7 + (hashLane(cellIndex, 1u) - 0.5) * 0.5 + 0.25) / 1.2;
  o = o < 0.5 ? sqrt(0.5 * o) : 1.0 - sqrt(0.5 * (1.0 - o));
  o = o + float(k) * 0.04 + hashLane(id, 4u) * 0.02;
  highp float p = max(uProgress, 0.0);
  highp float f = (p - uSpread * o) / max(uFlight, 1e-4);
  highp float blockV = texture(uField, targetUv).r;
  if (f <= 0.0 || f >= 1.0 || blockV < 0.02) {
    vQuad = vec2(0.0);
    vVal = 0.0;
    gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
    return;
  }
  highp float dL = targetUv.x;
  highp float dR = 1.0 - targetUv.x;
  highp float dT = targetUv.y;
  highp float dB = 1.0 - targetUv.y;
  highp float jit = (hashLane(id, 2u) - 0.5) * 0.3;
  highp float depth = 0.04 + 0.18 * hashLane(id, 3u);
  vec2 startUv;
  if (dL <= dR && dL <= dT && dL <= dB) {
    startUv = vec2(-depth, targetUv.y + jit);
  } else if (dR <= dT && dR <= dB) {
    startUv = vec2(1.0 + depth, targetUv.y + jit);
  } else if (dT <= dB) {
    startUv = vec2(targetUv.x + jit, -depth);
  } else {
    startUv = vec2(targetUv.x + jit, 1.0 + depth);
  }
  highp float ease = 1.0 - pow(1.0 - f, 3.0);
  highp float swirlTotal = uSwirl * 2.0 * (0.8 + 0.4 * hashLane(id, 5u));
  highp float swirlBlend = min(uSwirl, 1.0);
  vec2 posUv = vortexPos(startUv, targetUv, asp, swirlTotal, swirlBlend, ease);
  highp float f2 = min(f + 0.03, 1.0);
  highp float ease2 = 1.0 - pow(1.0 - f2, 3.0);
  vec2 vel = (vortexPos(startUv, targetUv, asp, swirlTotal, swirlBlend, ease2) - posUv) * asp;
  highp float vlen = length(vel);
  vec2 dirN = vlen > 1e-5 ? vel / vlen : vec2(1.0, 0.0);
  highp float stretch = 1.0 + min(3.5, vlen * 40.0) * uIntensity;
  highp float halfA = 0.5 * (1.0 / uGrid.y) * mix(1.2, 1.0, ease);
  int vid = gl_VertexID;
  highp float qx = (vid == 1 || vid == 2 || vid == 4) ? 1.0 : 0.0;
  highp float qy = (vid == 2 || vid == 4 || vid == 5) ? 1.0 : 0.0;
  vec2 corner0 = (vec2(qx, qy) - 0.5) * 2.0 * halfA * vec2(stretch, 1.0);
  vec2 rot = vec2(corner0.x * dirN.x - corner0.y * dirN.y, corner0.x * dirN.y + corner0.y * dirN.x);
  vec2 uvPos = posUv + rot / asp;
  vQuad = vec2(qx, qy);
  highp float fadeIn = smoothstep(0.0, 0.08, f);
  vVal = blockV * (float(k) + 1.0) / 3.0 * (1.0 + 0.25 * uGlow * (1.0 - f)) * fadeIn;
  gl_Position = vec4(uvPos * 2.0 - 1.0, 0.0, 1.0);
}
`,Ns=`#version 300 es
precision highp float;
in vec2 vQuad;
flat in highp float vVal;
out vec4 finalColor;
void main() {
  finalColor = vec4(vec3(vVal), 1.0);
}
`;function Xs(e,t){let a=V(e,Q,Hs),r=V(e,Vs,Ns),n=e.createVertexArray();if(!n)throw Error("Failed to create VAO");let o=u=>e.getUniformLocation(a,u),l={field:o("uField"),progress:o("uProgress"),spread:o("uSpread"),flight:o("uFlight"),grid:o("uGrid"),glow:o("uGlow"),aspect:o("uAspect")},i=u=>e.getUniformLocation(r,u),s={field:i("uField"),progress:i("uProgress"),spread:i("uSpread"),flight:i("uFlight"),grid:i("uGrid"),glow:i("uGlow"),intensity:i("uIntensity"),swirl:i("uSwirl"),aspect:i("uAspect")};return{render(u,f,c){X(e,u),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,f),e.useProgram(a),e.uniform1i(l.field,0),e.uniform1f(l.progress,c.progress),e.uniform1f(l.spread,c.spread),e.uniform1f(l.flight,c.flight),e.uniform2f(l.grid,c.gridX,c.gridY),e.uniform1f(l.glow,c.glow),e.uniform1f(l.aspect,c.aspect),t.draw(),c.progress<c.spread+c.flight&&(e.useProgram(r),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,f),e.uniform1i(s.field,0),e.uniform1f(s.progress,c.progress),e.uniform1f(s.spread,c.spread),e.uniform1f(s.flight,c.flight),e.uniform2f(s.grid,c.gridX,c.gridY),e.uniform1f(s.glow,c.glow),e.uniform1f(s.intensity,c.intensity),e.uniform1f(s.swirl,c.swirl),e.uniform1f(s.aspect,c.aspect),e.enable(e.BLEND),e.blendEquation(e.MAX),e.bindVertexArray(n),e.drawArraysInstanced(e.TRIANGLES,0,6,Math.max(1,Math.floor(c.count))),e.bindVertexArray(null),e.blendEquation(e.FUNC_ADD),e.disable(e.BLEND))},dispose(){e.deleteProgram(a),e.deleteProgram(r),e.deleteVertexArray(n)}}}var qs=`#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uField;
uniform float uProgress;
uniform float uForm;
uniform float uSpread;
uniform float uFlightMin;
uniform float uFlightMax;
uniform float uCollapse;
uniform vec2 uGrid;
uniform float uGlow;
uniform float uSwirl;
uniform float uArms;
uniform float uLens;
uniform float uHorizon;
uniform float uAspect;
out vec4 finalColor;

highp uint pcg(highp uint v) {
  v = v * 747796405u + 2891336453u;
  highp uint s = ((v >> ((v >> 28) + 4u)) ^ v) * 277803737u;
  return (s >> 22) ^ s;
}

highp float hashLane(highp uint i, highp uint salt) {
  return float(pcg(i * 747796405u + salt)) * (1.0 / 4294967296.0);
}

void main() {
  highp float p = max(uProgress, 0.0);
  if (p >= 1.0) {
    finalColor = vec4(vec3(texture(uField, vUv).r), 1.0);
    return;
  }
  vec2 asp = vec2(uAspect, 1.0);
  highp float cornerR = length(asp) * 0.5;
  vec2 q = (vUv - 0.5) * asp;
  highp float r = length(q);
  highp float ang = atan(q.y, q.x);

  highp float formT = uForm > 1e-4 ? clamp(p / uForm, 0.0, 1.0) : 1.0;
  highp float collapseT = uCollapse > 1e-4 ? clamp((p - (1.0 - uCollapse)) / uCollapse, 0.0, 1.0) : 0.0;

  highp float s1 = formT - 1.0;
  highp float grow = 1.0 + 2.70158 * s1 * s1 * s1 + 1.70158 * s1 * s1;
  highp float shrink = pow(1.0 - collapseT, 1.7);
  highp float paintT = clamp((p - uForm) / max(1.0 - uForm - uCollapse, 1e-4), 0.0, 1.0);
  highp float decay = pow(1.0 - smoothstep(0.06, 1.0, paintT), 1.3);
  highp float R = max(uHorizon * grow * shrink * decay, 0.0);

  vec2 cid = floor(vUv * uGrid);
  highp uint cellIndex = uint(cid.y * uGrid.x + cid.x);
  vec2 cellCenter = (cid + 0.5) / uGrid;
  vec2 cq = (cellCenter - 0.5) * asp;
  highp float dn = length(cq) / cornerR;
  highp float cang = atan(cq.y, cq.x);
  highp float armW = 0.5 + 0.5 * sin(cang * uArms - dn * (5.0 + 3.0 * uSwirl));
  highp float o = clamp(dn * 0.58 + armW * 0.34 + (hashLane(cellIndex, 1u) - 0.5) * 0.08 + 0.02, 0.0, 1.0);

  highp float blockV = texture(uField, cellCenter).r;
  highp float accFrac = 0.0;
  highp float lastRaw = 0.0;
  for (uint k = 0u; k < 3u; k++) {
    highp float ok = o + float(k) * 0.04 + hashLane(cellIndex * 3u + k, 4u) * 0.02;
    highp float fl = mix(uFlightMin, uFlightMax, hashLane(cellIndex * 3u + k, 6u));
    highp float fr = (p - uForm - uSpread * ok) / max(fl, 1e-4);
    accFrac += step(1.0, fr) / 3.0;
    if (k == 2u) {
      lastRaw = fr;
    }
  }
  highp float refine = smoothstep(1.0, 1.18, lastRaw);
  highp float flash = step(1.0, lastRaw) * (1.0 - smoothstep(1.0, 1.12, lastRaw));

  highp float lensEnv = formT * formT;
  highp float bendBase = pow(R / (r + R + 1e-5), 2.0);
  highp float angLens = uLens * lensEnv * bendBase * 1.5;
  highp float rPull = uLens * lensEnv * bendBase * r * 0.45;
  highp float R2 = uHorizon * 2.5;
  highp float twistEnv = (1.0 - smoothstep(1.0, 1.35, lastRaw)) * (1.0 - collapseT);
  highp float angTwist = uSwirl * 1.4 * twistEnv * (R2 / (r + R2));
  highp float A = ang + angLens + angTwist;
  highp float rr = max(r - rPull, R * 0.9);
  vec2 warpedUv = 0.5 + (vec2(cos(A), sin(A)) * rr) / asp;
  highp float fullV = texture(uField, warpedUv).r;

  highp float v = mix(blockV * accFrac, fullV, refine) * (1.0 + 0.35 * uGlow * flash);
  v *= smoothstep(R * 0.98, R * 1.03, r);

  highp float ringEnv = formT * formT * (1.0 - collapseT * collapseT);
  highp float photon = exp(-pow((r - R * 1.06) / max(R * 0.045, 1e-4), 2.0));
  highp float einstein = exp(-pow((r - R * 1.32) / max(R * 0.09, 1e-4), 2.0)) * 0.45;
  highp float ringV = (photon + einstein) * uGlow * ringEnv * (0.94 + 0.06 * sin(ang * uArms * 2.0 + p * 70.0));

  highp float diskR = (r - R * 1.45) / max(R * 1.15, 1e-4);
  highp float diskBody = exp(-diskR * diskR) * smoothstep(R * 1.1, R * 1.3, r);
  highp float bands = 0.4 + 0.6 * sin(r / max(R, 1e-4) * 13.0 - p * 70.0);
  highp float turb = 0.6 + 0.4 * sin(ang * 9.0 - r / max(R, 1e-4) * 7.0 + p * 95.0);
  highp float disk = uGlow * 0.75 * formT * (1.0 - collapseT) * diskBody * bands * bands * turb;

  highp float redshift = smoothstep(R * 0.995, R * 1.06, r);
  v = max(v, (ringV + disk) * redshift);
  finalColor = vec4(vec3(v), 1.0);
}
`,js=`#version 300 es
precision highp float;
uniform sampler2D uField;
uniform float uProgress;
uniform float uForm;
uniform float uSpread;
uniform float uFlightMin;
uniform float uFlightMax;
uniform float uCollapse;
uniform vec2 uGrid;
uniform float uGlow;
uniform float uSwirl;
uniform float uArms;
uniform float uHorizon;
uniform float uIntensity;
uniform float uAspect;
uniform float uDiskCount;
out vec2 vQuad;
flat out highp float vVal;
flat out highp float vSoft;

highp uint pcg(highp uint v) {
  v = v * 747796405u + 2891336453u;
  highp uint s = ((v >> ((v >> 28) + 4u)) ^ v) * 277803737u;
  return (s >> 22) ^ s;
}

highp float hashLane(highp uint i, highp uint salt) {
  return float(pcg(i * 747796405u + salt)) * (1.0 / 4294967296.0);
}

void cull(out vec2 q, out highp float val, out highp float soft) {
  q = vec2(0.0);
  val = 0.0;
  soft = 0.0;
  gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
}

void emitQuad(vec2 posUv, vec2 dirN, highp float halfA, highp float stretch, vec2 asp) {
  int vid = gl_VertexID;
  highp float qx = (vid == 1 || vid == 2 || vid == 4) ? 1.0 : 0.0;
  highp float qy = (vid == 2 || vid == 4 || vid == 5) ? 1.0 : 0.0;
  vec2 corner0 = (vec2(qx, qy) - 0.5) * 2.0 * halfA * vec2(stretch, 1.0);
  vec2 rot = vec2(corner0.x * dirN.x - corner0.y * dirN.y, corner0.x * dirN.y + corner0.y * dirN.x);
  vQuad = vec2(qx, qy);
  gl_Position = vec4((posUv + rot / asp) * 2.0 - 1.0, 0.0, 1.0);
}

void main() {
  highp uint id = uint(gl_InstanceID);
  highp float p = max(uProgress, 0.0);
  vec2 asp = vec2(uAspect, 1.0);
  highp float cornerR = length(asp) * 0.5;

  highp float formT = uForm > 1e-4 ? clamp(p / uForm, 0.0, 1.0) : 1.0;
  highp float collapseT = uCollapse > 1e-4 ? clamp((p - (1.0 - uCollapse)) / uCollapse, 0.0, 1.0) : 0.0;
  highp float s1 = formT - 1.0;
  highp float grow = 1.0 + 2.70158 * s1 * s1 * s1 + 1.70158 * s1 * s1;
  highp float shrink = pow(1.0 - collapseT, 1.7);
  highp float paintT = clamp((p - uForm) / max(1.0 - uForm - uCollapse, 1e-4), 0.0, 1.0);
  highp float decay = pow(1.0 - smoothstep(0.06, 1.0, paintT), 1.3);
  highp float R = max(uHorizon * grow * shrink * decay, 0.0);

  if (float(id) < uDiskCount) {
    highp float h1 = hashLane(id, 11u);
    highp float h2 = hashLane(id, 12u);
    highp float h3 = hashLane(id, 13u);
    highp float h5 = hashLane(id, 15u);
    highp float rBase = R * (1.12 + 2.1 * h1 * h1);
    highp float gap = 0.55 + 0.45 * sin(rBase / max(uHorizon, 1e-4) * 11.0);
    highp float infall = smoothstep(0.0, 1.0, formT * formT);
    highp float spiralIn = 1.0 - 0.12 * fract(h3 * 3.7 + p * 0.5);
    highp float rOrb = mix(rBase * 3.2, rBase * spiralIn, infall);
    highp float w = 76.0 / pow(max(rBase / max(uHorizon, 1e-4), 0.5), 1.5);
    highp float angD = h2 * 6.2831853 + w * p;
    highp float env = smoothstep(0.0, 0.6, formT) * pow(1.0 - collapseT, 1.5);
    highp float bright = uGlow * (0.25 + 0.75 * h3) * env * gap;
    if (bright < 0.01 || R < 1e-4) {
      cull(vQuad, vVal, vSoft);
      return;
    }
    vec2 dirN = vec2(-sin(angD), cos(angD));
    vec2 posUv = 0.5 + (vec2(cos(angD), sin(angD)) * rOrb) / asp;
    highp float halfA = (0.5 / uGrid.y) * (0.5 + 0.8 * h5) * (0.6 + 0.7 * h1);
    emitQuad(posUv, dirN, halfA, 2.5 + 6.0 * h1 * (1.0 - h1 * 0.5), asp);
    vVal = bright;
    vSoft = 1.0;
    return;
  }

  highp uint eid = id - uint(uDiskCount);
  highp uint cellIndex = eid / 3u;
  highp uint k = eid - cellIndex * 3u;
  highp float gx = uGrid.x;
  vec2 cell = vec2(mod(float(cellIndex), gx), floor(float(cellIndex) / gx));
  vec2 targetUv = (cell + 0.5) / uGrid;
  vec2 tq = (targetUv - 0.5) * asp;
  highp float dn = length(tq) / cornerR;
  highp float tang = atan(tq.y, tq.x);
  highp float armW = 0.5 + 0.5 * sin(tang * uArms - dn * (5.0 + 3.0 * uSwirl));
  highp float o = clamp(dn * 0.58 + armW * 0.34 + (hashLane(cellIndex, 1u) - 0.5) * 0.08 + 0.02, 0.0, 1.0);
  highp float ok = o + float(k) * 0.04 + hashLane(eid, 4u) * 0.02;
  highp float fl = max(mix(uFlightMin, uFlightMax, hashLane(eid, 6u)), 1e-4);
  highp float f = (p - uForm - uSpread * ok) / fl;
  highp float blockV = texture(uField, targetUv).r;
  if (f <= 0.0 || f >= 1.0 || blockV < 0.02) {
    cull(vQuad, vVal, vSoft);
    return;
  }
  highp float rT = length(tq);
  highp float rS = R * 1.05;
  highp float swirlTotal = uSwirl * (5.8 + 2.6 * hashLane(eid, 5u));
  highp float e = 1.0 - pow(1.0 - f, 3.0);
  highp float A1 = tang + swirlTotal * (1.0 - e);
  highp float r1 = mix(rS, rT, e);
  vec2 posUv = 0.5 + (vec2(cos(A1), sin(A1)) * r1) / asp;
  highp float f2 = min(f + 0.03, 1.0);
  highp float e2 = 1.0 - pow(1.0 - f2, 3.0);
  highp float A2 = tang + swirlTotal * (1.0 - e2);
  highp float r2 = mix(rS, rT, e2);
  vec2 vel = (0.5 + (vec2(cos(A2), sin(A2)) * r2) / asp - posUv) * asp;
  highp float vlen = length(vel);
  vec2 dirN = vlen > 1e-5 ? vel / vlen : vec2(1.0, 0.0);
  highp float stretch = 1.0 + min(3.5, vlen * 40.0) * uIntensity;
  highp float halfA = 0.5 * (1.0 / uGrid.y) * mix(1.2, 1.0, e);
  emitQuad(posUv, dirN, halfA, stretch, asp);
  highp float fadeIn = smoothstep(0.0, 0.08, f);
  vVal = blockV * (float(k) + 1.0) / 3.0 * (1.0 + 0.25 * uGlow * (1.0 - f)) * fadeIn;
  vSoft = 0.0;
}
`,$s=`#version 300 es
precision highp float;
in vec2 vQuad;
flat in highp float vVal;
flat in highp float vSoft;
out vec4 finalColor;
void main() {
  highp float sx = smoothstep(0.0, 0.3, vQuad.x) * smoothstep(1.0, 0.7, vQuad.x);
  highp float sy = smoothstep(0.0, 0.3, vQuad.y) * smoothstep(1.0, 0.7, vQuad.y);
  finalColor = vec4(vec3(vVal * mix(1.0, sx * sy, vSoft)), 1.0);
}
`;function Ys(e,t){let a=V(e,Q,qs),r=V(e,js,$s),n=e.createVertexArray();if(!n)throw Error("Failed to create VAO");let o=u=>e.getUniformLocation(a,u),l={field:o("uField"),progress:o("uProgress"),form:o("uForm"),spread:o("uSpread"),flightMin:o("uFlightMin"),flightMax:o("uFlightMax"),collapse:o("uCollapse"),grid:o("uGrid"),glow:o("uGlow"),swirl:o("uSwirl"),arms:o("uArms"),lens:o("uLens"),horizon:o("uHorizon"),aspect:o("uAspect")},i=u=>e.getUniformLocation(r,u),s={field:i("uField"),progress:i("uProgress"),form:i("uForm"),spread:i("uSpread"),flightMin:i("uFlightMin"),flightMax:i("uFlightMax"),collapse:i("uCollapse"),grid:i("uGrid"),glow:i("uGlow"),swirl:i("uSwirl"),arms:i("uArms"),horizon:i("uHorizon"),intensity:i("uIntensity"),aspect:i("uAspect"),diskCount:i("uDiskCount")};return{render(u,f,c){X(e,u),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,f),e.useProgram(a),e.uniform1i(l.field,0),e.uniform1f(l.progress,c.progress),e.uniform1f(l.form,c.form),e.uniform1f(l.spread,c.spread),e.uniform1f(l.flightMin,c.flightMin),e.uniform1f(l.flightMax,c.flightMax),e.uniform1f(l.collapse,c.collapse),e.uniform2f(l.grid,c.gridX,c.gridY),e.uniform1f(l.glow,c.glow),e.uniform1f(l.swirl,c.swirl),e.uniform1f(l.arms,c.arms),e.uniform1f(l.lens,c.lensing),e.uniform1f(l.horizon,c.horizon),e.uniform1f(l.aspect,c.aspect),t.draw(),c.progress<1&&(e.useProgram(r),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,f),e.uniform1i(s.field,0),e.uniform1f(s.progress,c.progress),e.uniform1f(s.form,c.form),e.uniform1f(s.spread,c.spread),e.uniform1f(s.flightMin,c.flightMin),e.uniform1f(s.flightMax,c.flightMax),e.uniform1f(s.collapse,c.collapse),e.uniform2f(s.grid,c.gridX,c.gridY),e.uniform1f(s.glow,c.glow),e.uniform1f(s.swirl,c.swirl),e.uniform1f(s.arms,c.arms),e.uniform1f(s.horizon,c.horizon),e.uniform1f(s.intensity,c.intensity),e.uniform1f(s.aspect,c.aspect),e.uniform1f(s.diskCount,c.diskCount),e.enable(e.BLEND),e.blendEquation(e.MAX),e.bindVertexArray(n),e.drawArraysInstanced(e.TRIANGLES,0,6,Math.max(1,Math.floor(c.count))),e.bindVertexArray(null),e.blendEquation(e.FUNC_ADD),e.disable(e.BLEND))},dispose(){e.deleteProgram(a),e.deleteProgram(r),e.deleteVertexArray(n)}}}var Ks=`#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uField;
uniform float uProgress;
uniform float uTurns;
uniform float uTightness;
uniform float uStreak;
uniform float uGlow;
uniform float uAspect;
out vec4 finalColor;

const highp float TAU = 6.2831853;
const highp float ARMS = 4.0;
/* Angular speed never drops to nothing at the rim, or the outer ring could not complete a
   turn inside the animation and would have no moment to lock on. */
const highp float SPEED = 37.7;

vec2 mirrorUv(vec2 uv) {
  vec2 m = mod(uv, 2.0);
  return mix(m, 2.0 - m, step(1.0, m));
}

highp float sampleSwirl(highp float r, highp float ang, highp float theta, vec2 asp) {
  highp float A = ang + theta;
  return texture(uField, mirrorUv(0.5 + (vec2(cos(A), sin(A)) * r) / asp)).r;
}

highp float envelopeWobble(highp float r, highp float ang) {
  return 0.5 * sin(ang * 4.0 + r * 9.0) + 0.3 * sin(ang * 8.0 - r * 15.0 + 1.3);
}

void main() {
  highp float p = clamp(uProgress, 0.0, 1.0);
  highp float sharp = texture(uField, vUv).r;
  if (p >= 1.0) {
    finalColor = vec4(vec3(sharp), 1.0);
    return;
  }
  vec2 asp = vec2(uAspect, 1.0);
  vec2 q = (vUv - 0.5) * asp;
  highp float r = length(q);
  highp float ang = atan(q.y, q.x);
  highp float maxR = length(asp) * 0.5;
  highp float rn = clamp(r / max(maxR, 1e-4), 0.0, 1.0);
  highp float falloff = uTightness / (r + uTightness);

  /* Pure differential rotation: wound at the start, spinning faster toward the centre. */
  highp float wound = uTurns * TAU * falloff;
  highp float omega = SPEED * (0.35 + 0.65 * falloff);
  highp float theta = wound + omega * p;

  /* Eligibility spreads outward and along the arms; the lock still happens only on a whole
     turn, so arms differ by exactly one revolution. */
  highp float eligible = mix(0.22, 0.6, rn)
    + (0.5 - 0.5 * cos(ang * ARMS + wound)) * 0.05
    + envelopeWobble(r, ang) * 0.012;

  /* A whole turn means the rotated sample lands back on this very texel: cover == image, so
     locking it in is seamless. The reveal IS the rotation completing. */
  highp float thetaAtEligible = wound + omega * eligible;
  highp float arrival = eligible + mod(-thetaAtEligible, TAU) / omega;
  highp float locked = smoothstep(arrival, arrival + 0.02, p);

  /* Motion blur has to vanish as the lock approaches, otherwise the cover is smeared at the
     exact moment it is supposed to match the image. */
  highp float toLock = clamp((arrival - p) / 0.25, 0.0, 1.0);
  highp float arc = omega * 0.016 * (0.5 + 3.5 * uStreak) * toLock;

  highp float cover = 0.0;
  for (int i = 0; i < 5; i++) {
    cover += sampleSwirl(r, ang, theta + arc * ((float(i) - 2.0) / 2.0), asp) * 0.2;
  }
  cover *= smoothstep(0.0, 0.06, p);

  highp float v = mix(cover, sharp, locked);
  highp float rim = locked * (1.0 - locked) * 4.0;
  v *= 1.0 + uGlow * 0.25 * rim * rim;
  finalColor = vec4(vec3(v), 1.0);
}
`;function Js(e,t){let a=V(e,Q,Ks),r=o=>e.getUniformLocation(a,o),n={field:r("uField"),progress:r("uProgress"),turns:r("uTurns"),tightness:r("uTightness"),streak:r("uStreak"),glow:r("uGlow"),aspect:r("uAspect")};return{render(o,l,i){X(e,o),e.useProgram(a),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,l),e.uniform1i(n.field,0),e.uniform1f(n.progress,i.progress),e.uniform1f(n.turns,i.turns),e.uniform1f(n.tightness,i.tightness),e.uniform1f(n.streak,i.streak),e.uniform1f(n.glow,i.glow),e.uniform1f(n.aspect,i.aspect),t.draw()},dispose(){e.deleteProgram(a)}}}var Qs=`#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uField;
uniform sampler2D uCover;
uniform sampler2D uHeight;
uniform vec2 uHeightTexel;
uniform float uRefraction;
uniform float uWhiteK;
uniform float uGlow;
uniform float uActive;
uniform float uFade;
out vec4 finalColor;

// Water alpha compresses instead of clipping: crest/(crest+K) approaches 1 but
// never reaches it, so a strong splat stays a gradient rather than flattening
// into a solid white plateau. Must match the same curve in waterRevealAccum.
float waterAlpha(float crest, float k) {
  return crest / (crest + k);
}

void main() {
  if (uActive < 0.5) {
    finalColor = vec4(vec3(texture(uField, vUv).r), 1.0);
    return;
  }
  float hL = texture(uHeight, vUv - vec2(uHeightTexel.x, 0.0)).r;
  float hR = texture(uHeight, vUv + vec2(uHeightTexel.x, 0.0)).r;
  float hT = texture(uHeight, vUv + vec2(0.0, uHeightTexel.y)).r;
  float hB = texture(uHeight, vUv - vec2(0.0, uHeightTexel.y)).r;
  vec2 grad = vec2(hR - hL, hT - hB);
  vec2 uv = clamp(vUv - grad * uRefraction * 0.04 * uFade, 0.0, 1.0);
  float v = texture(uField, uv).r;
  float crest = max(texture(uHeight, vUv).r, 0.0);
  v = clamp(v + waterAlpha(crest, uWhiteK) * uGlow * uFade, 0.0, 1.0);
  float cover = mix(1.0, texture(uCover, vUv).r, uFade);
  finalColor = vec4(vec3(v * cover), 1.0);
}
`;function Zs(e,t){let a=V(e,Q,Qs),r=o=>e.getUniformLocation(a,o),n={field:r("uField"),cover:r("uCover"),height:r("uHeight"),heightTexel:r("uHeightTexel"),refraction:r("uRefraction"),whiteK:r("uWhiteK"),glow:r("uGlow"),active:r("uActive"),fade:r("uFade")};return{render(o,l,i,s){if(X(e,o),e.useProgram(a),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,l),e.uniform1i(n.field,0),!i){e.activeTexture(e.TEXTURE1),e.bindTexture(e.TEXTURE_2D,l),e.uniform1i(n.cover,1),e.activeTexture(e.TEXTURE2),e.bindTexture(e.TEXTURE_2D,l),e.uniform1i(n.height,2),e.uniform1f(n.active,0),t.draw(),e.bindFramebuffer(e.FRAMEBUFFER,null);return}e.activeTexture(e.TEXTURE1),e.bindTexture(e.TEXTURE_2D,i.cover),e.uniform1i(n.cover,1),e.activeTexture(e.TEXTURE2),e.bindTexture(e.TEXTURE_2D,i.height),e.uniform1i(n.height,2),e.uniform2f(n.heightTexel,i.texelX,i.texelY),e.uniform1f(n.refraction,s.refraction),e.uniform1f(n.whiteK,s.whiteK),e.uniform1f(n.glow,s.glow),e.uniform1f(n.fade,s.fade),e.uniform1f(n.active,1),t.draw(),e.bindFramebuffer(e.FRAMEBUFFER,null)},dispose(){e.deleteProgram(a)}}}var eu=`#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uStep;
out vec4 finalColor;

void main() {
  float w0 = 0.22702703;
  float w1 = 0.19459460;
  float w2 = 0.12162162;
  float w3 = 0.05405405;
  float w4 = 0.01621622;
  vec4 c =
    texture(uTex, vUv + uStep * -4.0) * w4 +
    texture(uTex, vUv + uStep * -3.0) * w3 +
    texture(uTex, vUv + uStep * -2.0) * w2 +
    texture(uTex, vUv + uStep * -1.0) * w1 +
    texture(uTex, vUv              ) * w0 +
    texture(uTex, vUv + uStep *  1.0) * w1 +
    texture(uTex, vUv + uStep *  2.0) * w2 +
    texture(uTex, vUv + uStep *  3.0) * w3 +
    texture(uTex, vUv + uStep *  4.0) * w4;
  finalColor = c;
}
`;function tu(e,t){let a=V(e,Q,eu),r=e.getUniformLocation(a,"uTex"),n=e.getUniformLocation(a,"uStep");function o(l,i,s,u){X(e,i),e.useProgram(a),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,l),e.uniform1i(r,0),e.uniform2f(n,s,u),t.draw()}return{render(l,i,s,u,f){let c=u/f.width/4,m=u/f.height/4;o(l,i,c,0),o(i.texture,s,0,m)},copy(l,i){o(l,i,0,0)},dispose(){e.deleteProgram(a)}}}var ci=`
${ui}
uniform sampler2D uCell;
uniform sampler2D uLut;
uniform sampler2D uOpacityLut;
uniform sampler2D uBandValueLut;
uniform float uStripeBandCount;
uniform sampler2D uCellColor;
uniform vec2 uGridCount;
uniform vec2 uCellPx;
uniform float uCellMin;
uniform float uCellMax;
uniform float uTimeSec;
uniform float uGapEnabled;
uniform float uGapCoverage;
uniform float uGapPeriodMin;
uniform float uGapPeriodMax;
uniform float uStripeSparkleEnabled;
uniform float uStripeSparkleCoverage;
uniform float uStripeSparkleMaxBrightness;
uniform float uStripeSparkleSpeed;
uniform float uStripeSparkleMinWidthPx;
uniform float uStripeSparkleHueDriftDeg;
uniform float uStripeSparkleSaturationBoost;
uniform float uShuffleEnabled;
uniform float uShuffleCoverage;
uniform float uShufflePeriodMin;
uniform float uShufflePeriodMax;
uniform float uShuffleSwingPx;
uniform float uMotionEnabled;
uniform float uMotionAmplitudePx;
uniform float uMotionStaggerPx;
uniform float uMotionMaxOffsetPx;
uniform float uMotionSpeed;
uniform float uUseCellColors;
uniform float uImageColorLightness;
uniform float uImageColorDensity;
uniform float uGradientEnabled;
uniform float uGradientDirection;
uniform float uGradientStopCount;
uniform vec3 uGradientStop0;
uniform vec3 uGradientStop1;
uniform vec3 uGradientStop2;
uniform vec3 uGradientStop3;
uniform float uGradientHueDriftDeg;
uniform float uGradientSaturationBoost;

float sparkleHash(float px, float py) {
  float p3x = fract(px * 0.1031);
  float p3y = fract(py * 0.103);
  float p3z = fract(px * 0.0973);
  float dotVal = p3x * (p3y + 33.33) + p3y * (p3z + 33.33) + p3z * (p3x + 33.33);
  p3x = fract(p3x + dotVal);
  p3y = fract(p3y + dotVal);
  p3z = fract(p3z + dotVal);
  return fract((p3x + p3y) * p3z);
}

float phaseHash(float col, float row) {
  return sparkleHash(col + 53.0, row + 71.0);
}

float periodHash(float col, float row) {
  return sparkleHash(col + 89.0, row + 113.0);
}

float cellSeed(float col, float row) {
  return sparkleHash(col + 17.0, row + 31.0);
}

float altHash(float col, float row, float pulseIndex) {
  return sparkleHash(col + 53.0 + pulseIndex * 61.0, row + 71.0 + pulseIndex * 101.0);
}

struct CellPulse {
  float localTime;
  float period;
  float cycleIndex;
};

CellPulse cellPulse(float col, float row, float timeSec, float coverage, float periodMin, float periodMax) {
  float periodSpan = periodMax - periodMin;
  float period = periodMin + periodHash(col, row) * periodSpan;
  float cyclePeriod = period / max(coverage, 0.001);
  float phaseOffset = phaseHash(col, row) * cyclePeriod;
  float scheduledTime = timeSec + phaseOffset;
  float cycleIndex = floor(scheduledTime / cyclePeriod);
  float localTime = scheduledTime - cycleIndex * cyclePeriod;
  CellPulse p;
  p.localTime = localTime;
  p.period = period;
  p.cycleIndex = cycleIndex;
  return p;
}

bool isGapped(float col, float row) {
  if (uGapCoverage <= 0.0) return false;
  CellPulse p = cellPulse(col, row, uTimeSec, uGapCoverage, uGapPeriodMin, uGapPeriodMax);
  return p.localTime < p.period;
}

float pulseEnvelope(float localT) {
  if (localT < 0.0 || localT > 1.0) return 0.0;
  float cosine = 0.5 - 0.5 * cos(2.0 * 3.141592653589793 * localT);
  float c = clamp(cosine, 0.0, 1.0);
  return c * c * (3.0 - 2.0 * c);
}

float shuffledWidth(float col, float row, float defaultWidth) {
  if (defaultWidth <= 0.0) return defaultWidth;
  if (cellSeed(col, row) >= uShuffleCoverage) return defaultWidth;
  CellPulse p = cellPulse(col, row, uTimeSec, uShuffleCoverage, uShufflePeriodMin, uShufflePeriodMax);
  if (p.localTime >= p.period) return defaultWidth;
  float localT = p.localTime / p.period;
  float h = altHash(col, row, p.cycleIndex);
  float maxWidth = min(255.0, max(uCellPx.x, uCellPx.y));
  float tw = clamp(defaultWidth + (h * 2.0 - 1.0) * max(uShuffleSwingPx, 0.0), 1.0, maxWidth);
  float envelope = pulseEnvelope(localT);
  return defaultWidth + (tw - defaultWidth) * envelope;
}

float randomColumnMotionTarget(float col, float cycleIndex) {
  float patternSeed = uMotionStaggerPx * 0.61803398875;
  return sparkleHash(col + patternSeed + 307.0, cycleIndex + patternSeed + 401.0) * 2.0 - 1.0;
}

float randomColumnMotionOffset(float col) {
  if (uMotionEnabled <= 0.5 || uMotionAmplitudePx <= 0.0 || uMotionMaxOffsetPx <= 0.0) return 0.0;
  float patternSeed = uMotionStaggerPx * 0.61803398875;
  float columnRate = mix(0.65, 1.35, sparkleHash(col + patternSeed + 89.0, patternSeed + 113.0));
  float columnPhase = sparkleHash(col + patternSeed + 179.0, patternSeed + 233.0) * 7.0;
  float randomTime = uTimeSec * max(uMotionSpeed, 0.05) * columnRate + columnPhase;
  float cycleIndex = floor(randomTime);
  float cycleT = fract(randomTime);
  float easedT = cycleT * cycleT * (3.0 - 2.0 * cycleT);
  float wave = mix(
    randomColumnMotionTarget(col, cycleIndex),
    randomColumnMotionTarget(col, cycleIndex + 1.0),
    easedT
  );
  float amplitude = min(max(uMotionAmplitudePx, 0.0), max(uMotionMaxOffsetPx, 0.0));
  return wave * amplitude;
}

float colorLightness(vec3 c) {
  float hi = max(max(c.r, c.g), c.b);
  float lo = min(min(c.r, c.g), c.b);
  return (hi + lo) * 0.5;
}

vec3 withLightness(vec3 base, float targetLightness) {
  float currentLightness = colorLightness(base);
  float target = clamp(targetLightness, 0.0, 1.0);
  if (currentLightness < 0.0001 || currentLightness > 0.9999) return vec3(target);
  if (target < currentLightness) {
    return clamp(base * (target / currentLightness), 0.0, 1.0);
  }
  return clamp(1.0 - (1.0 - base) * ((1.0 - target) / (1.0 - currentLightness)), 0.0, 1.0);
}

vec3 rgbToHsl(vec3 c) {
  float maxc = max(max(c.r, c.g), c.b);
  float minc = min(min(c.r, c.g), c.b);
  float l = (maxc + minc) * 0.5;
  float h = 0.0;
  float s = 0.0;
  float d = maxc - minc;
  if (d > 0.00001) {
    s = l > 0.5 ? d / (2.0 - maxc - minc) : d / (maxc + minc);
    if (maxc == c.r) h = (c.g - c.b) / d + (c.g < c.b ? 6.0 : 0.0);
    else if (maxc == c.g) h = (c.b - c.r) / d + 2.0;
    else h = (c.r - c.g) / d + 4.0;
    h /= 6.0;
  }
  return vec3(h, s, l);
}

float hueToRgb(float p, float q, float t) {
  if (t < 0.0) t += 1.0;
  if (t > 1.0) t -= 1.0;
  if (t < 1.0 / 6.0) return p + (q - p) * 6.0 * t;
  if (t < 1.0 / 2.0) return q;
  if (t < 2.0 / 3.0) return p + (q - p) * (2.0 / 3.0 - t) * 6.0;
  return p;
}

vec3 hslToRgb(vec3 hsl) {
  float h = fract(hsl.x);
  float s = clamp(hsl.y, 0.0, 1.0);
  float l = clamp(hsl.z, 0.0, 1.0);
  if (s <= 0.00001) return vec3(l);
  float q = l < 0.5 ? l * (1.0 + s) : l + s - l * s;
  float p = 2.0 * l - q;
  return vec3(
    hueToRgb(p, q, h + 1.0 / 3.0),
    hueToRgb(p, q, h),
    hueToRgb(p, q, h - 1.0 / 3.0)
  );
}

vec3 applyStripeSparkleTone(vec3 color, float amount) {
  vec3 hsl = rgbToHsl(color);
  if (hsl.y <= 0.0001) return color;
  hsl.y = clamp(hsl.y * (1.0 + clamp(uStripeSparkleSaturationBoost, 0.0, 1.0) * amount), 0.0, 1.0);
  return hslToRgb(hsl);
}

float stripeSparkleAmount(float col, float row) {
  if (uStripeSparkleEnabled <= 0.5) return 0.0;
  float coverage = clamp(uStripeSparkleCoverage, 0.0, 1.0);
  if (coverage <= 0.0) return 0.0;
  if (cellSeed(col, row) >= coverage) return 0.0;
  float speed = max(uStripeSparkleSpeed, 0.05);
  float periodMin = 0.18 / speed;
  float periodMax = 0.85 / speed;
  CellPulse p = cellPulse(col + 179.0, row + 233.0, uTimeSec, coverage, periodMin, periodMax);
  if (p.localTime >= p.period) return 0.0;
  return pulseEnvelope(p.localTime / p.period) * clamp(uStripeSparkleMaxBrightness, 0.0, 1.0);
}

vec3 applyStripeSparkle(vec3 color, vec2 cell, float widthPx, float opacity) {
  if (uStripeSparkleEnabled <= 0.5) return color;
  if (widthPx < uStripeSparkleMinWidthPx || opacity <= 0.001) return color;
  float amount = stripeSparkleAmount(cell.x, cell.y);
  vec3 brightened = withLightness(color, colorLightness(color) + amount);
  return applyStripeSparkleTone(brightened, amount);
}

float gradientPosition(vec2 uv, float direction) {
  float t = 1.0 - uv.y;
  if (direction > 0.5 && direction < 1.5) t = uv.x;
  else if (direction > 1.5 && direction < 2.5) t = 1.0 - uv.x;
  else if (direction > 2.5) t = uv.y;
  return clamp(t, 0.0, 1.0);
}

vec3 gradientRamp(vec2 uv, float direction, float stopCount, vec3 stop0, vec3 stop1, vec3 stop2, vec3 stop3) {
  float t = gradientPosition(uv, direction);

  if (stopCount < 2.5) {
    return mix(stop0, stop1, t);
  }
  if (stopCount < 3.5) {
    if (t < 0.5) return mix(stop0, stop1, t / 0.5);
    return mix(stop1, stop2, (t - 0.5) / 0.5);
  }
  if (t < 0.3333333) return mix(stop0, stop1, t / 0.3333333);
  if (t < 0.6666667) return mix(stop1, stop2, (t - 0.3333333) / 0.3333334);
  return mix(stop2, stop3, (t - 0.6666667) / 0.3333333);
}

vec3 gradientColor(vec2 uv) {
  return gradientRamp(uv, uGradientDirection, uGradientStopCount, uGradientStop0, uGradientStop1, uGradientStop2, uGradientStop3);
}

vec3 gradientAverageColor() {
  if (uGradientStopCount < 2.5) return (uGradientStop0 + uGradientStop1) * 0.5;
  if (uGradientStopCount < 3.5) return (uGradientStop0 + uGradientStop1 + uGradientStop2) / 3.0;
  return (uGradientStop0 + uGradientStop1 + uGradientStop2 + uGradientStop3) * 0.25;
}

vec3 gradientColorWithRampLightness(vec2 uv, vec3 rampColor, float rampT) {
  vec3 localColor = gradientColor(uv);
  vec3 hsl = rgbToHsl(localColor);
  float t = clamp(rampT, 0.0, 1.0);
  if (hsl.y > 0.0001) {
    hsl.x = fract(hsl.x + (uGradientHueDriftDeg * t) / 360.0);
    float satLift = clamp(uGradientSaturationBoost, 0.0, 1.0) * sin(t * 3.141592653589793 * 0.85);
    hsl.y = clamp(hsl.y * (1.0 + satLift), 0.0, 1.0);
    localColor = hslToRgb(hsl);
  }
  float baseLightness = colorLightness(gradientAverageColor());
  float lightnessLift = max(0.0, colorLightness(rampColor) - baseLightness);
  return withLightness(localColor, colorLightness(localColor) + lightnessLift);
}

vec3 applyImageColorLightness(vec3 color) {
  float amount = clamp(uImageColorLightness, -1.0, 1.0);
  return amount >= 0.0 ? mix(color, vec3(1.0), amount) : mix(color, vec3(0.0), -amount);
}

vec3 cellImageColor(vec2 uv) {
  vec2 colorCell = clamp(floor(uv * uGridCount), vec2(0.0), max(vec2(0.0), uGridCount - 1.0));
  vec2 colorUv = (colorCell + 0.5) / uGridCount;
  vec3 color = texture(uCellColor, colorUv).rgb;
  return applyImageColorLightness(color);
}

bool imageColorDensityVisible(vec2 cell) {
  float density = clamp(uImageColorDensity, 0.0, 1.0);
  if (density >= 0.999) return true;
  if (density <= 0.001) return false;
  float col = clamp(floor(cell.x), 0.0, max(0.0, uGridCount.x - 1.0));
  float row = clamp(floor(cell.y), 0.0, max(0.0, uGridCount.y - 1.0));
  float chunk = floor(row / 20.0);
  float localRow = row - chunk * 20.0;
  float splitRow = 5.0 + floor(sparkleHash(col + 421.0, chunk + 17.0) * 11.0);
  float side = localRow < splitRow ? 0.0 : 1.0;
  float cluster = col * 4096.0 + chunk * 2.0 + side;
  return sparkleHash(cluster + 197.0, 313.0) <= density;
}

float normalizedCellValue(vec2 uv) {
  float raw = texture(uCell, uv).r;
  return clamp((raw - uCellMin) / max(0.0001, uCellMax - uCellMin), 0.0, 1.0);
}

float stripeBandAt(float value01) {
  vec2 lutUv = vec2((value01 * 255.0 + 0.5) / 256.0, 0.5);
  return floor(texture(uOpacityLut, lutUv).a * 255.0 + 0.5) - 1.0;
}

float stripeBandValue(float band) {
  return texture(uBandValueLut, vec2((band + 0.5) / 256.0, 0.5)).r;
}

highp uint edgeMaskDitherHash(vec2 cell) {
  highp uint inputValue = uint(cell.x) * 2654435769u + uint(cell.y) * 2246822507u + 3266489913u;
  highp uint state = inputValue * 747796405u + 2891336453u;
  highp uint word = ((state >> ((state >> 28u) + 4u)) ^ state) * 277803737u;
  return (word >> 22u) ^ word;
}

float edgeMaskDither(float shift, vec2 cell) {
  if (uContourFieldEnabled < 0.5) return cellSeed(cell.x, cell.y) < fract(shift) ? 1.0 : 0.0;
  highp uint threshold = uint(fract(shift) * 65536.0);
  return (edgeMaskDitherHash(cell) >> 16u) < threshold ? 1.0 : 0.0;
}

/**
 * The edge mask, as a walk DOWN the authored stripe ladder.
 *
 * The ramp does not scale anything. It shifts the cell's BAND index, and the
 * cell then renders as whatever the config authored for the band it lands on —
 * that band's width, its opacity, its colour. So the fade is built out of
 * stripes the design already contains, and it is the same mechanism in both
 * colour modes: only the source of the stripe colour differs downstream.
 *
 * The shift is fractional, and the fraction becomes a per-cell probability
 * rather than a rounding. Without it the boundary between two bands is a clean
 * line parallel to the canvas edge, which reads as a cut; spending the fraction
 * as a coin flip per cell scatters that boundary into a grain. The hash is
 * static, so the grain does not shimmer between frames.
 *
 * Returns a source value that lands in the target band, or -1 when the cell has
 * dropped off the bottom of the ladder and renders nothing at all.
 */
float edgeMaskWalkedValue(float value01, vec2 uv, vec2 cell) {
  if (uStripeBandCount < 1.0) return value01;
  float ramp = edgeMaskAlpha(uv);
  if (ramp >= 1.0) return value01;
  float shift = (1.0 - ramp) * uStripeBandCount;
  float dither = edgeMaskDither(shift, cell);
  float band = stripeBandAt(value01) - floor(shift) - dither;
  if (band < 0.0) return -1.0;
  return stripeBandValue(band);
}

/**
 * Per-cell stripe state, before the width shuffle. A negative \`widthPx\` means
 * the cell is already hidden (gap pulse, or an image colour cell thinned out by
 * density); \`shuffledWidth\` passes it through untouched, so callers need one
 * \`< 0.5\` test to cover both that and a sub-pixel stripe.
 */
struct CellData {
  vec3 color;
  float widthPx;
  float opacity;
  float rampT;
  float dotEligible;
};

CellData cellData(vec2 cell) {
  vec2 sourceCell = clamp(cell, vec2(0.0), max(vec2(0.0), uGridCount - 1.0));
  vec2 sourceUv = (sourceCell + 0.5) / uGridCount;
  bool hidden = false;
  float v = normalizedCellValue(sourceUv);
  float walked = edgeMaskWalkedValue(v, sourceUv, sourceCell);
  if (walked < 0.0) hidden = true;
  else v = walked;
  vec2 lutUv = vec2((v * 255.0 + 0.5) / 256.0, 0.5);
  vec4 lut = texture(uLut, lutUv);
  vec4 opacityMeta = texture(uOpacityLut, lutUv);

  CellData d;
  d.color = lut.rgb;
  d.widthPx = (lut.a * 255.0) * 0.5;
  d.opacity = opacityMeta.r;
  d.rampT = opacityMeta.g;
  d.dotEligible = opacityMeta.b;

  if (uUseCellColors > 0.5) {
    d.color = cellImageColor(sourceUv);
  }
  if (uGradientEnabled > 0.5 && uUseCellColors < 0.5) {
    d.color = gradientColorWithRampLightness(sourceUv, d.color, d.rampT);
  }
  d.color = applyStripeSparkle(d.color, sourceCell, d.widthPx, d.opacity);

  if (uGapEnabled > 0.5 && uGapCoverage > 0.0 && isGapped(cell.x, cell.y)) hidden = true;
  if (uUseCellColors > 0.5 && !imageColorDensityVisible(sourceCell)) hidden = true;
  if (hidden) d.widthPx = -1.0;
  return d;
}
`,au=`#version 300 es
precision highp float;
in vec2 vUv;
${ci}
uniform sampler2D uCellDataA;
uniform sampler2D uCellDataB;
uniform float uUseCellData;
uniform vec2 uGridGapPx;
uniform float uCorner;
uniform float uOrient;
uniform float uAngleDeg;
uniform float uRotationMode;
uniform vec3 uBg;
uniform float uBgAlpha;
uniform float uTransparent;
uniform float uBgGradientEnabled;
uniform float uBgGradientDirection;
uniform float uBgGradientStopCount;
uniform vec3 uBgGradientStop0;
uniform vec3 uBgGradientStop1;
uniform vec3 uBgGradientStop2;
uniform vec3 uBgGradientStop3;
uniform float uBgGridEnabled;
uniform vec2 uBgGridCellPx;
uniform vec2 uBgGridGapPx;
uniform float uBgGridCorner;
uniform vec3 uBgGridColor;
uniform float uBgGridOpacity;
uniform vec2 uDisplayPx;
uniform float uDpr;
uniform float uStripeDotsEnabled;
uniform float uStripeDotsSizePx;
uniform float uStripeDotsRandomVisibility;
uniform float uStripeDotsBrightness;
uniform float uStripeDotsHueDriftDeg;
uniform float uStripeDotsSaturationBoost;
uniform float uStripeBorderEnabled;
uniform float uStripeBorderMinWidthPx;
uniform float uStripeBorderDensity;
uniform float uGridLinesEnabled;
uniform float uGridLinesBrightness;
uniform float uGridLinesDensity;
uniform float uLettersEnabled;
uniform sampler2D uGlyphData;
uniform sampler2D uAtlas;
uniform vec2 uAtlasGrid;
uniform float uLetterSizeScale;
uniform float uOverlapAmount;
uniform float uStreamGapWaveEnabled;
uniform float uStreamGapWaveSqueeze;
uniform float uStreamGapWaveWavelengthCells;
uniform float uStreamGapWaveSpeed;
uniform float uStreamGapWavePhaseDeg;
uniform vec3 uLetterColor;
uniform float uBlendMode;
out vec4 finalColor;

float sdRoundBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

float streamGapWaveOffset(float stackIndex, float stackCellPx) {
  if (uStreamGapWaveEnabled <= 0.5 || uStreamGapWaveSqueeze <= 0.0) return 0.0;
  float tau = 6.283185307179586;
  float stepPhase = tau / max(uStreamGapWaveWavelengthCells, 2.0);
  float denominator = max(2.0 * sin(stepPhase * 0.5), 0.001);
  float amplitude = clamp(uStreamGapWaveSqueeze, 0.0, 1.0) * stackCellPx / denominator;
  float timePhase = uTimeSec * uStreamGapWaveSpeed * tau + radians(uStreamGapWavePhaseDeg);
  return sin(stackIndex * stepPhase + timePhase) * amplitude;
}

struct MotionCell {
  vec2 cell;
  vec2 local;
};

/**
 * Every row of a column shifts by the same offset, so the shifted grid is a
 * pure translation: the covering row is \`floor((yPx - offset) / cellPx.y)\`
 * clamped into the grid. The three candidates around it keep the original
 * scan's exact scoring and tie-break while dropping the rest of the sweep —
 * rows further out always score above 100 (they miss the cell outright).
 */
MotionCell resolveMotionCell(vec2 cellF, float offset) {
  MotionCell result;
  result.cell = floor(cellF);
  result.local = fract(cellF);
  if (uMotionEnabled <= 0.5 || uMotionAmplitudePx <= 0.0 || uMotionMaxOffsetPx <= 0.0) return result;

  float yPx = cellF.y * uCellPx.y;
  float maxRow = max(0.0, uGridCount.y - 1.0);
  float coveringRow = floor((yPx - offset) / uCellPx.y);
  float bestScore = 100000.0;
  vec2 bestCell = result.cell;
  vec2 bestLocal = result.local;

  for (int i = -1; i <= 1; i++) {
    float row = clamp(coveringRow + float(i), 0.0, maxRow);
    float localY = (yPx - (row * uCellPx.y + offset)) / uCellPx.y;
    float outside = max(max(-localY, localY - 1.0), 0.0);
    float centerDist = abs(localY - 0.5);
    float score = outside * 100.0 + centerDist;
    if (score < bestScore) {
      bestScore = score;
      bestCell = vec2(result.cell.x, row);
      bestLocal = vec2(result.local.x, clamp(localY, 0.0, 1.0));
    }
  }

  result.cell = bestCell;
  result.local = bestLocal;
  return result;
}

float stripeAlpha(vec2 p, vec2 halfExt, float r, float w) {
  float d = sdRoundBox(p, halfExt, r);
  return clamp(0.5 - d / w, 0.0, 1.0);
}

vec3 backgroundGradientColor(vec2 uv) {
  return gradientRamp(
    uv,
    uBgGradientDirection,
    uBgGradientStopCount,
    uBgGradientStop0,
    uBgGradientStop1,
    uBgGradientStop2,
    uBgGradientStop3
  );
}

vec4 backgroundColor(vec2 uv) {
  if (uTransparent > 0.5) return vec4(0.0);
  vec3 bgRgb = uBgGradientEnabled > 0.5 ? backgroundGradientColor(uv) : uBg;
  vec4 bg = vec4(bgRgb, clamp(uBgAlpha, 0.0, 1.0));
  vec2 displayPx = max(vec2(1.0), uDisplayPx);
  vec2 pixel = uv * displayPx;
  float w = max(1.0 / uDpr, 1e-4);

  if (uBgGridEnabled > 0.5 && uBgGridOpacity > 0.0) {
    vec2 cellPx = max(vec2(1.0), uBgGridCellPx);
    vec2 local = fract(pixel / cellPx);
    vec2 drawablePx = max(vec2(0.0001), cellPx - clamp(uBgGridGapPx, vec2(0.0), cellPx));
    vec2 p = (local - 0.5) * cellPx;
    vec2 halfSize = drawablePx * 0.5;
    float r = min(uBgGridCorner, min(halfSize.x, halfSize.y));
    float d = sdRoundBox(p, halfSize, r);
    float alpha = clamp(0.5 - d / w, 0.0, 1.0) * clamp(uBgGridOpacity, 0.0, 1.0);
    bg = mix(bg, vec4(uBgGridColor, 1.0), alpha);
  }

  return bg;
}

vec3 blendStripeColor(vec3 base, vec3 source) {
  if (uBlendMode < 0.5) return source;
  if (uBlendMode < 1.5) return base * source;
  if (uBlendMode < 2.5) return 1.0 - (1.0 - base) * (1.0 - source);
  if (uBlendMode < 3.5) {
    return mix(
      2.0 * base * source,
      1.0 - 2.0 * (1.0 - base) * (1.0 - source),
      step(vec3(0.5), base)
    );
  }
  if (uBlendMode < 4.5) return min(base, source);
  if (uBlendMode < 5.5) return max(base, source);
  if (uBlendMode < 6.5) return abs(base - source);
  return base + source - 2.0 * base * source;
}

float stripeDotAlpha(
  vec2 centeredP,
  vec2 stripeCell,
  float eligible,
  float widthPx,
  float opacity,
  float aaWidth
) {
  if (uStripeDotsEnabled <= 0.5 || eligible < 0.5 || widthPx < 2.0 || opacity <= 0.001) return 0.0;
  float visibility = clamp(uStripeDotsRandomVisibility, 0.0, 1.0);
  if (sparkleHash(stripeCell.x + 137.0, stripeCell.y + 174.0) >= visibility) return 0.0;
  float radius = clamp(uStripeDotsSizePx, 1.0, 2.0) * 0.5;
  return clamp(0.5 - (length(centeredP) - radius) / aaWidth, 0.0, 1.0);
}

vec3 stripeBrightnessColor(vec3 stripeColor, float brightness) {
  float lightnessLift = clamp(brightness, 0.0, 1.0);
  if (lightnessLift <= 0.0001) return stripeColor;
  vec3 stripeHsl = rgbToHsl(stripeColor);
  stripeHsl.z = clamp(stripeHsl.z + lightnessLift, 0.0, 1.0);
  return hslToRgb(stripeHsl);
}

vec3 stripeDotColor(vec3 stripeColor, float rampT) {
  vec3 hsl = rgbToHsl(stripeColor);
  hsl.z = clamp(hsl.z + clamp(uStripeDotsBrightness, 0.0, 1.0), 0.0, 1.0);
  if (hsl.y <= 0.0001) return vec3(hsl.z);
  float t = clamp(rampT, 0.0, 1.0);
  hsl.x = fract(hsl.x + (uStripeDotsHueDriftDeg * t) / 360.0);
  float satLift = clamp(uStripeDotsSaturationBoost, 0.0, 1.0) * sin(t * 3.141592653589793 * 0.85);
  hsl.y = clamp(hsl.y * (1.0 + satLift), 0.0, 1.0);
  return hslToRgb(hsl);
}

vec3 dottedStripeColor(vec3 stripeColor, float rampT, float dotAlpha) {
  if (dotAlpha <= 0.0) return stripeColor;
  return mix(stripeColor, stripeDotColor(stripeColor, rampT), dotAlpha);
}

float stripeShapeAlpha(
  vec2 centeredP,
  vec2 halfExt,
  vec2 borderHalfExt,
  float cornerRadius,
  float geometryAlpha,
  float widthPx,
  float aaWidth,
  vec2 stripeCell
) {
  if (uStripeBorderEnabled <= 0.5 || widthPx < uStripeBorderMinWidthPx) return geometryAlpha;
  float density = clamp(uStripeBorderDensity, 0.0, 1.0);
  if (density <= 0.001 || (density < 0.999 && cellSeed(stripeCell.x, stripeCell.y) > density)) {
    return geometryAlpha;
  }
  float inset = 1.0;
  vec2 outerHalfExt = min(halfExt, borderHalfExt);
  float outerRadius = min(cornerRadius, min(outerHalfExt.x, outerHalfExt.y));
  float outerAlpha = stripeAlpha(centeredP, outerHalfExt, outerRadius, aaWidth);
  vec2 innerHalfExt = max(outerHalfExt - vec2(inset), vec2(0.0));
  float innerRadius = max(0.0, outerRadius - inset);
  float innerAlpha = stripeAlpha(centeredP, innerHalfExt, innerRadius, aaWidth);
  return max(0.0, outerAlpha - innerAlpha);
}

bool gridLineCellVisible(vec2 cell, float density, bool allowOutsideGrid) {
  if (!allowOutsideGrid && (any(lessThan(cell, vec2(0.0))) || any(greaterThanEqual(cell, uGridCount)))) return false;
  return density >= 0.999 || cellSeed(cell.x + 211.0, cell.y + 307.0) <= density;
}

float gridLineAlpha(vec2 rawCellF, float aaWidth, bool allowOutsideGrid) {
  if (uGridLinesEnabled <= 0.5) return 0.0;
  float density = clamp(uGridLinesDensity, 0.0, 1.0);
  if (density <= 0.001) return 0.0;

  vec2 rawCell = floor(rawCellF);
  vec2 rawLocal = fract(rawCellF);
  vec2 edgeDistancePx = min(rawLocal, 1.0 - rawLocal) * uCellPx;
  float verticalAlpha = clamp(0.5 - (edgeDistancePx.x - 0.5) / aaWidth, 0.0, 1.0);
  float horizontalAlpha = clamp(0.5 - (edgeDistancePx.y - 0.5) / aaWidth, 0.0, 1.0);
  bool currentVisible = gridLineCellVisible(rawCell, density, allowOutsideGrid);
  float xSide = rawLocal.x < 0.5 ? -1.0 : 1.0;
  float ySide = rawLocal.y < 0.5 ? -1.0 : 1.0;
  vec2 verticalNeighbor = rawCell + vec2(xSide, 0.0);
  vec2 horizontalNeighbor = rawCell + vec2(0.0, ySide);
  vec2 diagonalNeighbor = rawCell + vec2(xSide, ySide);
  bool verticalCellVisible = currentVisible || gridLineCellVisible(verticalNeighbor, density, allowOutsideGrid);
  bool horizontalCellVisible = currentVisible || gridLineCellVisible(horizontalNeighbor, density, allowOutsideGrid);
  bool cornerCellVisible =
    verticalCellVisible ||
    horizontalCellVisible ||
    gridLineCellVisible(diagonalNeighbor, density, allowOutsideGrid);
  float verticalVisible = verticalCellVisible ? 1.0 : 0.0;
  float horizontalVisible = horizontalCellVisible ? 1.0 : 0.0;
  float squareCornerAlpha = cornerCellVisible ? min(verticalAlpha, horizontalAlpha) : 0.0;
  verticalAlpha *= verticalVisible;
  horizontalAlpha *= horizontalVisible;
  return max(max(verticalAlpha, horizontalAlpha), squareCornerAlpha);
}

CellData fetchCellData(vec2 cell) {
  ivec2 texel = ivec2(cell);
  vec4 packedA = texelFetch(uCellDataA, texel, 0);
  vec4 packedB = texelFetch(uCellDataB, texel, 0);
  CellData d;
  d.color = packedA.rgb;
  d.widthPx = packedA.a;
  d.opacity = packedB.r;
  d.rampT = packedB.g;
  d.dotEligible = packedB.b;
  return d;
}

void main() {
  vec4 bgColor = backgroundColor(vUv);
  float angleRad = radians(uAngleDeg);
  vec2 renderUv = vUv;

  vec2 cellF = renderUv * uGridCount;
  float motionOffset = 0.0;
  if (uMotionEnabled > 0.5 && uMotionAmplitudePx > 0.0 && uMotionMaxOffsetPx > 0.0) {
    motionOffset = uUseCellData > 0.5
      ? texelFetch(uCellDataB, ivec2(int(floor(cellF.x)), 0), 0).a
      : randomColumnMotionOffset(floor(cellF.x));
  }
  MotionCell motionCell = resolveMotionCell(cellF, motionOffset);
  vec2 cell = motionCell.cell;
  vec2 local = motionCell.local;
  vec2 sourceCell = clamp(cell, vec2(0.0), max(vec2(0.0), uGridCount - 1.0));
  CellData cellState;
  if (uUseCellData > 0.5) cellState = fetchCellData(sourceCell);
  else cellState = cellData(cell);
  vec3 barColor = cellState.color;
  float barOpacity = cellState.opacity;
  float barRampT = cellState.rampT;
  float barDotEligible = cellState.dotEligible;
  float barWidthPx = cellState.widthPx;
  if (uShuffleEnabled > 0.5) barWidthPx = shuffledWidth(cell.x, cell.y, barWidthPx);
  // The edge mask has already been applied — \`cellData\` walked the cell down the
  // stripe ladder before the LUT lookup, so \`barWidthPx\` is an authored width
  // and a masked-out cell arrives with the same negative width a gap pulse uses.
  bool cellHidden = barWidthPx < 0.5;
  barWidthPx = max(barWidthPx, 0.0);

  float earlyAngleNorm = mod(abs(uAngleDeg), 180.0);
  bool willUseNeighborRotation = abs(earlyAngleNorm) > 0.001 && abs(earlyAngleNorm - 90.0) > 0.001;
  bool baseStripeVisible = willUseNeighborRotation || !cellHidden;

  vec2 drawablePx = max(vec2(0.0001), uCellPx - clamp(uGridGapPx, vec2(0.0), uCellPx));
  vec2 p = (local - 0.5) * uCellPx;
  float w = max(1.0 / uDpr, 1e-4);
  float cellAngleRad = angleRad;
  vec2 axis = vec2(sin(cellAngleRad), cos(cellAngleRad));
  vec2 normal = vec2(cos(cellAngleRad), -sin(cellAngleRad));
  float angleNorm = mod(abs(uAngleDeg), 180.0);
  bool arbitraryAngle = abs(angleNorm) > 0.001 && abs(angleNorm - 90.0) > 0.001;
  bool overlapRotation = uRotationMode > 1.5;
  float overlapAmount = overlapRotation ? clamp(uOverlapAmount, 0.0, 4.0) : 1.0;
  float extendY = (uGridGapPx.y <= 0.0001) ? w : 0.0;
  float extendX = (uGridGapPx.x <= 0.0001) ? w : 0.0;
  float noGapExtend = max(extendX, extendY);
  vec2 gridLineCellF = cellF;
  if (arbitraryAngle) {
    vec2 displayPx = max(vec2(1.0), uDisplayPx);
    vec2 centeredPixel = vUv * displayPx - displayPx * 0.5;
    float normalCoord = dot(centeredPixel, normal);
    float axisCoord = dot(centeredPixel, axis);
    if (uOrient > 0.5) {
      gridLineCellF = vec2(
        (axisCoord + displayPx.x * 0.5) / max(uCellPx.x, 0.0001),
        (normalCoord + displayPx.y * 0.5) / max(uCellPx.y, 0.0001)
      );
    } else {
      gridLineCellF = vec2(
        (normalCoord + displayPx.x * 0.5) / max(uCellPx.x, 0.0001),
        (axisCoord + displayPx.y * 0.5) / max(uCellPx.y, 0.0001)
      );
    }
  }

  if (arbitraryAngle) {
    vec2 displayPx = max(vec2(1.0), uDisplayPx);
    vec2 pixel = vUv * displayPx;
    vec2 displayCenter = displayPx * 0.5;
    vec2 centeredPixel = pixel - displayCenter;
    bool horizontalStacks = uOrient > 0.5;
    float stackCellPx = max(0.0001, horizontalStacks ? uCellPx.y : uCellPx.x);
    float axisCellPx = max(0.0001, horizontalStacks ? uCellPx.x : uCellPx.y);
    float stackGapPx = max(0.0, horizontalStacks ? uGridGapPx.y : uGridGapPx.x);
    float axisGapPx = max(0.0, horizontalStacks ? uGridGapPx.x : uGridGapPx.y);
    float stackSpanPx = max(1.0, horizontalStacks ? displayPx.y : displayPx.x);
    float axisSpanPx = max(1.0, horizontalStacks ? displayPx.x : displayPx.y);
    float stackCoord = dot(centeredPixel, normal) + stackSpanPx * 0.5;
    float axisCoord = dot(centeredPixel, axis) + axisSpanPx * 0.5;
    float baseStack = floor(stackCoord / stackCellPx);
    float baseAxis = floor(axisCoord / axisCellPx);
    float drawableStackPx = max(0.0001, stackCellPx - min(stackGapPx, stackCellPx));
    float drawableAxisPx = max(0.0001, axisCellPx - min(axisGapPx, axisCellPx));
    float groupNoGapExtend = axisGapPx <= 0.0001 ? w : 0.0;
    float motionReach = uMotionEnabled > 0.5
      ? min(max(uMotionAmplitudePx, 0.0), max(uMotionMaxOffsetPx, 0.0))
      : 0.0;
    float maxNormalReach = drawableStackPx * 0.5 + abs(normal.y) * motionReach + w;
    float maxAxisReach =
      drawableAxisPx * 0.5 +
      drawableStackPx * 0.5 * overlapAmount +
      abs(axis.y) * motionReach +
      groupNoGapExtend +
      w * 2.0;
    float bestAlpha = 0.0;
    vec3 bestColor = barColor;
    float bestDepth = -1.0;
    vec4 overlapColor = bgColor;

    float gapWaveStep = 6.283185307179586 / max(uStreamGapWaveWavelengthCells, 2.0);
    float gapWaveAmplitude = uStreamGapWaveEnabled > 0.5
      ? clamp(uStreamGapWaveSqueeze, 0.0, 1.0) * stackCellPx / max(2.0 * sin(gapWaveStep * 0.5), 0.001)
      : 0.0;
    float stackSearch = max(
      uStreamGapWaveEnabled > 0.5 ? ceil(gapWaveAmplitude / stackCellPx) + 2.0 : 1.0,
      ceil(abs(normal.y) * motionReach / stackCellPx) + 2.0
    );
    float axisSearch = ceil(abs(axis.y) * motionReach / axisCellPx) + 2.0;
    int stackSpan = int(min(stackSearch, 20.0));
    int axisSpan = int(min(axisSearch, 20.0));
    for (int ss = -stackSpan; ss <= stackSpan; ss++) {
      float stackIndex = baseStack + float(ss);
      float stackCenter = (stackIndex + 0.5) * stackCellPx + streamGapWaveOffset(stackIndex, stackCellPx);

      for (int aa = -axisSpan; aa <= axisSpan; aa++) {
        float axisIndex = baseAxis + float(aa);
        float axisCenter = (axisIndex + 0.5) * axisCellPx;
        float normalDist = stackCoord - stackCenter;
        float axisDist = axisCoord - axisCenter;
        if (abs(normalDist) > maxNormalReach) continue;
        if (abs(axisDist) > maxAxisReach) continue;

        vec2 candidateCell = horizontalStacks ? vec2(axisIndex, stackIndex) : vec2(stackIndex, axisIndex);
        vec2 candidateBaseCenterPixel =
          displayCenter +
          normal * (stackCenter - stackSpanPx * 0.5) +
          axis * (axisCenter - axisSpanPx * 0.5);
        vec2 candidateUv = clamp(candidateBaseCenterPixel / displayPx, vec2(0.0), vec2(1.0));

        float candidateValue = normalizedCellValue(candidateUv);
        float candidateWalked = edgeMaskWalkedValue(candidateValue, candidateUv, candidateCell);
        if (candidateWalked < 0.0) continue;
        candidateValue = candidateWalked;
        vec2 candidateLutUv = vec2((candidateValue * 255.0 + 0.5) / 256.0, 0.5);
        vec4 candidateLut = texture(uLut, candidateLutUv);
        float candidateWidthPx = (candidateLut.a * 255.0) * 0.5;

        if (uShuffleEnabled > 0.5) candidateWidthPx = shuffledWidth(candidateCell.x, candidateCell.y, candidateWidthPx);
        if (uUseCellColors > 0.5 && !imageColorDensityVisible(candidateCell)) continue;
        if (candidateWidthPx < 0.5) continue;
        if (uGapEnabled > 0.5 && uGapCoverage > 0.0 && isGapped(candidateCell.x, candidateCell.y)) continue;

        vec2 candidateCenterPixel = candidateBaseCenterPixel;
        candidateCenterPixel.y += randomColumnMotionOffset(candidateCell.x);
        vec2 candidateDelta = pixel - candidateCenterPixel;
        vec2 candidateRotatedP = vec2(dot(candidateDelta, normal), dot(candidateDelta, axis));
        float candidateHalfW = min(candidateWidthPx, drawableStackPx) * 0.5;
        float candidateHalfH = drawableAxisPx * 0.5 + groupNoGapExtend + candidateHalfW * overlapAmount + w;
        float candidateR = min(uCorner, min(candidateHalfW, candidateHalfH));
        float candidateGeometryAlpha = stripeAlpha(candidateRotatedP, vec2(candidateHalfW, candidateHalfH), candidateR, w);
        if (candidateGeometryAlpha <= 0.001) continue;

        vec4 candidateOpacityMeta = texture(uOpacityLut, candidateLutUv);
        float candidateOpacity = candidateOpacityMeta.r;
        float candidateRampT = candidateOpacityMeta.g;
        float candidateDotEligible = candidateOpacityMeta.b;
        float candidateShapeAlpha = stripeShapeAlpha(
          candidateRotatedP,
          vec2(candidateHalfW, candidateHalfH),
          vec2(candidateHalfW, drawableAxisPx * 0.5),
          candidateR,
          candidateGeometryAlpha,
          candidateWidthPx,
          w,
          candidateCell
        );
        float candidateDotAlpha = stripeDotAlpha(
          candidateRotatedP,
          candidateCell,
          candidateDotEligible,
          candidateWidthPx,
          candidateOpacity,
          w
        );
        float candidateAlpha = max(candidateShapeAlpha, candidateDotAlpha) * candidateOpacity;
        if (candidateAlpha > 0.001) {
          vec3 candidateColor = candidateLut.rgb;
          if (uUseCellColors > 0.5) {
            candidateColor = cellImageColor(candidateUv);
          }
          if (uGradientEnabled > 0.5 && uUseCellColors < 0.5) {
            candidateColor = gradientColorWithRampLightness(candidateUv, candidateColor, candidateRampT);
          }
          candidateColor = applyStripeSparkle(candidateColor, candidateCell, candidateWidthPx, candidateOpacity);
          candidateColor = dottedStripeColor(candidateColor, candidateRampT, candidateDotAlpha);

          if (overlapRotation) {
            vec3 blendedCandidateColor = bgColor.a <= 0.0001 ? candidateColor : blendStripeColor(bgColor.rgb, candidateColor);
            overlapColor = mix(overlapColor, vec4(blendedCandidateColor, 1.0), candidateAlpha);
            continue;
          }

          if (
            candidateValue <= bestDepth + 0.0001 &&
            (abs(candidateValue - bestDepth) > 0.0001 || candidateAlpha <= bestAlpha)
          ) {
            continue;
          }

          bestAlpha = candidateAlpha;
          bestColor = candidateColor;
          bestDepth = candidateValue;
        }
      }
    }

    if (overlapRotation) {
      finalColor = overlapColor;
    } else {
      vec3 blendedBestColor = bgColor.a <= 0.0001 ? bestColor : blendStripeColor(bgColor.rgb, bestColor);
      finalColor = mix(bgColor, vec4(blendedBestColor, 1.0), bestAlpha);
    }
  } else {
    if (!baseStripeVisible) {
      finalColor = bgColor;
    } else {
      vec2 rotatedP = vec2(dot(p, normal), dot(p, axis));
      float halfW = min(barWidthPx, max(drawablePx.x, drawablePx.y)) * 0.5;
      float halfH = length(drawablePx) * 0.5;
      float r = min(uCorner, min(halfW, halfH));
      vec2 halfExt = vec2(halfW, halfH + noGapExtend + r);
      float geometryAlpha = stripeAlpha(rotatedP, halfExt, r, w);
      float borderHalfH = max(w, dot(abs(axis), drawablePx) * 0.5);
      float shapeAlpha = stripeShapeAlpha(
        rotatedP,
        halfExt,
        vec2(halfW, borderHalfH),
        r,
        geometryAlpha,
        barWidthPx,
        w,
        sourceCell
      );
      float dotAlpha = stripeDotAlpha(rotatedP, sourceCell, barDotEligible, barWidthPx, barOpacity, w) * geometryAlpha;
      float effectiveAlpha = max(shapeAlpha, dotAlpha) * barOpacity;
      vec3 dottedBarColor = dottedStripeColor(barColor, barRampT, dotAlpha);
      vec3 blendedBarColor = bgColor.a <= 0.0001 ? dottedBarColor : blendStripeColor(bgColor.rgb, dottedBarColor);
      finalColor = mix(bgColor, vec4(blendedBarColor, 1.0), effectiveAlpha);
    }
  }

  float lineAlpha = gridLineAlpha(gridLineCellF, w, arbitraryAngle);
  if (lineAlpha > 0.001) {
    vec3 lineColor = stripeBrightnessColor(barColor, uGridLinesBrightness);
    vec3 blendedLineColor = finalColor.a <= 0.0001 ? lineColor : blendStripeColor(finalColor.rgb, lineColor);
    finalColor = mix(finalColor, vec4(blendedLineColor, 1.0), lineAlpha);
  }

  if (uLettersEnabled > 0.5) {
    float data = texture(uGlyphData, (cell + 0.5) / uGridCount).r * 255.0;
    if (data >= 0.5) {
      float gi = floor(data + 0.5) - 1.0;
      vec2 gpos = (local - 0.5) / max(uLetterSizeScale, 0.001) + 0.5;
      if (all(greaterThanEqual(gpos, vec2(0.0))) && all(lessThanEqual(gpos, vec2(1.0)))) {
        float gcol = mod(gi, uAtlasGrid.x);
        float grow = floor(gi / uAtlasGrid.x);
        vec2 atlasUv = (vec2(gcol, grow) + vec2(gpos.x, 1.0 - gpos.y)) / uAtlasGrid;
        float cov = texture(uAtlas, atlasUv).r;
        if (uTransparent > 0.5) finalColor *= 1.0 - cov;
        else finalColor.rgb = mix(finalColor.rgb, uLetterColor, cov);
      }
    }
  }
}
`;function fi(e){return e.edgeMask.enabled?"stripe":"none"}function di(e,t){let a=r=>e.getUniformLocation(t,r);return{cell:a("uCell"),lut:a("uLut"),opacityLut:a("uOpacityLut"),bandValueLut:a("uBandValueLut"),stripeBandCount:a("uStripeBandCount"),edgeMaskEnabled:a("uEdgeMaskEnabled"),edgeMaskStart:a("uEdgeMaskStart"),edgeMaskEnd:a("uEdgeMaskEnd"),edgeMaskPower:a("uEdgeMaskPower"),edgeMaskSides:a("uEdgeMaskSides"),contourFieldEnabled:a("uContourFieldEnabled"),contourField:a("uContourField"),contourMinCssPx:a("uContourMinCssPx"),cellColor:a("uCellColor"),grid:a("uGridCount"),cellPx:a("uCellPx"),cellMin:a("uCellMin"),cellMax:a("uCellMax"),timeSec:a("uTimeSec"),gapEnabled:a("uGapEnabled"),gapCoverage:a("uGapCoverage"),gapPeriodMin:a("uGapPeriodMin"),gapPeriodMax:a("uGapPeriodMax"),stripeSparkleEnabled:a("uStripeSparkleEnabled"),stripeSparkleCoverage:a("uStripeSparkleCoverage"),stripeSparkleMaxBrightness:a("uStripeSparkleMaxBrightness"),stripeSparkleSpeed:a("uStripeSparkleSpeed"),stripeSparkleMinWidthPx:a("uStripeSparkleMinWidthPx"),stripeSparkleHueDriftDeg:a("uStripeSparkleHueDriftDeg"),stripeSparkleSaturationBoost:a("uStripeSparkleSaturationBoost"),shuffleEnabled:a("uShuffleEnabled"),shuffleCoverage:a("uShuffleCoverage"),shufflePeriodMin:a("uShufflePeriodMin"),shufflePeriodMax:a("uShufflePeriodMax"),shuffleSwingPx:a("uShuffleSwingPx"),motionEnabled:a("uMotionEnabled"),motionAmplitudePx:a("uMotionAmplitudePx"),motionStaggerPx:a("uMotionStaggerPx"),motionMaxOffsetPx:a("uMotionMaxOffsetPx"),motionSpeed:a("uMotionSpeed"),useCellColors:a("uUseCellColors"),imageColorLightness:a("uImageColorLightness"),imageColorDensity:a("uImageColorDensity"),gradientEnabled:a("uGradientEnabled"),gradientDirection:a("uGradientDirection"),gradientStopCount:a("uGradientStopCount"),gradientStop0:a("uGradientStop0"),gradientStop1:a("uGradientStop1"),gradientStop2:a("uGradientStop2"),gradientStop3:a("uGradientStop3"),gradientHueDriftDeg:a("uGradientHueDriftDeg"),gradientSaturationBoost:a("uGradientSaturationBoost")}}function hi(e,t,a,r,n){e.activeTexture(e.TEXTURE0+0),e.bindTexture(e.TEXTURE_2D,r),e.uniform1i(t.cell,0),e.activeTexture(e.TEXTURE0+1),e.bindTexture(e.TEXTURE_2D,n),e.uniform1i(t.lut,1),e.activeTexture(e.TEXTURE0+5),e.bindTexture(e.TEXTURE_2D,a.opacityTex),e.uniform1i(t.opacityLut,5),e.activeTexture(e.TEXTURE0+8),e.bindTexture(e.TEXTURE_2D,a.bandValueTex),e.uniform1i(t.bandValueLut,8),e.activeTexture(e.TEXTURE0+4),e.bindTexture(e.TEXTURE_2D,a.cellColorTex),e.uniform1i(t.cellColor,4),e.uniform1f(t.stripeBandCount,a.stripeBandCount),e.uniform1f(t.edgeMaskEnabled,+!!a.edgeMaskEnabled),e.uniform1f(t.edgeMaskStart,a.edgeMaskStart),e.uniform1f(t.edgeMaskEnd,a.edgeMaskEnd),e.uniform1f(t.edgeMaskPower,a.edgeMaskPower),e.uniform4f(t.edgeMaskSides,...a.edgeMaskSides),e.activeTexture(e.TEXTURE0+9),e.bindTexture(e.TEXTURE_2D,a.contourFieldTex),e.uniform1i(t.contourField,9),e.uniform1f(t.contourFieldEnabled,+!!a.contourFieldEnabled),e.uniform1f(t.contourMinCssPx,a.contourMinCssPx),e.uniform2f(t.grid,a.cols,a.rows),e.uniform2f(t.cellPx,a.cellW,a.cellH),e.uniform1f(t.cellMin,a.cellMin),e.uniform1f(t.cellMax,a.cellMax),e.uniform1f(t.timeSec,a.timeSec),e.uniform1f(t.gapEnabled,+!!a.gapEnabled),e.uniform1f(t.gapCoverage,a.gapCoverage),e.uniform1f(t.gapPeriodMin,a.gapPeriodMin),e.uniform1f(t.gapPeriodMax,a.gapPeriodMax),e.uniform1f(t.stripeSparkleEnabled,+!!a.stripeSparkleEnabled),e.uniform1f(t.stripeSparkleCoverage,a.stripeSparkleCoverage),e.uniform1f(t.stripeSparkleMaxBrightness,a.stripeSparkleMaxBrightness),e.uniform1f(t.stripeSparkleSpeed,a.stripeSparkleSpeed),e.uniform1f(t.stripeSparkleMinWidthPx,a.stripeSparkleMinWidthPx),e.uniform1f(t.stripeSparkleHueDriftDeg,a.stripeSparkleHueDriftDeg),e.uniform1f(t.stripeSparkleSaturationBoost,a.stripeSparkleSaturationBoost),e.uniform1f(t.shuffleEnabled,+!!a.shuffleEnabled),e.uniform1f(t.shuffleCoverage,a.shuffleCoverage),e.uniform1f(t.shufflePeriodMin,a.shufflePeriodMin),e.uniform1f(t.shufflePeriodMax,a.shufflePeriodMax),e.uniform1f(t.shuffleSwingPx,a.shuffleSwingPx),e.uniform1f(t.motionEnabled,+!!a.motionEnabled),e.uniform1f(t.motionAmplitudePx,a.motionAmplitudePx),e.uniform1f(t.motionStaggerPx,a.motionStaggerPx),e.uniform1f(t.motionMaxOffsetPx,a.motionMaxOffsetPx),e.uniform1f(t.motionSpeed,a.motionSpeed),e.uniform1f(t.useCellColors,+!!a.useCellColors),e.uniform1f(t.imageColorLightness,a.imageColorLightness),e.uniform1f(t.imageColorDensity,a.imageColorDensity),e.uniform1f(t.gradientEnabled,+!!a.gradientEnabled),e.uniform1f(t.gradientDirection,a.gradientDirection),e.uniform1f(t.gradientStopCount,a.gradientStopCount),e.uniform3f(t.gradientStop0,...Ce(a.gradientStops[0])),e.uniform3f(t.gradientStop1,...Ce(a.gradientStops[1])),e.uniform3f(t.gradientStop2,...Ce(a.gradientStops[2])),e.uniform3f(t.gradientStop3,...Ce(a.gradientStops[3])),e.uniform1f(t.gradientHueDriftDeg,a.gradientHueDriftDeg),e.uniform1f(t.gradientSaturationBoost,a.gradientSaturationBoost)}function Tn(e,t){let a=Math.max(.05,e.sparkle.gaps.speed);return{cellW:e.grid.cellWidth,cellH:e.grid.cellHeight,gapX:e.grid.gapX,gapY:e.grid.gapY,cornerRadius:e.grid.cornerRadius,orientation:+(e.grid.orientation==="horizontal"),angleDeg:e.grid.angleDeg,rotationMode:e.grid.rotationMode==="overlap"?2:0,overlapAmount:e.grid.overlapAmount,streamGapWaveEnabled:e.grid.streamGapWave.enabled,streamGapWaveSqueeze:e.grid.streamGapWave.squeeze,streamGapWaveWavelengthCells:e.grid.streamGapWave.wavelengthCells,streamGapWaveSpeed:e.grid.streamGapWave.speed,streamGapWavePhaseDeg:e.grid.streamGapWave.phaseDeg,cellMin:0,cellMax:1,cols:t.cols,rows:t.rows,background:e.background.color,backgroundAlpha:+!e.background.transparent,transparent:e.background.transparent,backgroundGradientEnabled:!e.background.transparent&&e.background.gradient.enabled,backgroundGradientDirection:xn(e.background.gradient.direction),backgroundGradientStopCount:e.background.gradient.stopCount,backgroundGradientStops:e.background.gradient.stops,backgroundGridEnabled:!e.background.transparent&&e.background.grid.enabled,backgroundGridCellW:e.background.grid.cellWidth,backgroundGridCellH:e.background.grid.cellHeight,backgroundGridGapX:e.background.grid.gapX,backgroundGridGapY:e.background.grid.gapY,backgroundGridCornerRadius:e.background.grid.cornerRadius,backgroundGridColor:e.background.grid.color,backgroundGridOpacity:e.background.grid.opacity,displayW:t.displayW,displayH:t.displayH,dpr:t.dpr,timeSec:t.timeSec,gapEnabled:e.sparkle.gaps.enabled,gapCoverage:e.sparkle.gaps.coverage,gapPeriodMin:.21/a,gapPeriodMax:.55/a,stripeSparkleEnabled:e.sparkle.stripe.enabled,stripeSparkleCoverage:e.sparkle.stripe.coverage,stripeSparkleMaxBrightness:e.sparkle.stripe.maxBrightness,stripeSparkleSpeed:e.sparkle.stripe.speed,stripeSparkleMinWidthPx:(()=>{let r=Array.from(new Set(e.stripes.filter(o=>o.opacity>.001&&o.width>=.5).map(o=>Math.round(o.width*1e3)/1e3))).sort((o,l)=>l-o);if(r.length===0)return 1e6;let n=Math.max(1,Math.round(e.sparkle.stripe.thickestCount));return r[Math.min(n-1,r.length-1)]})(),stripeSparkleHueDriftDeg:e.sparkle.stripe.hueDriftDeg,stripeSparkleSaturationBoost:e.sparkle.stripe.saturationBoost,stripeDotsEnabled:e.stripeDots.enabled,stripeDotsSizePx:e.stripeDots.sizePx,stripeDotsRandomVisibility:e.stripeDots.randomVisibility,stripeDotsBrightness:e.stripeDots.brightness,stripeDotsHueDriftDeg:e.stripeDots.hueDriftDeg,stripeDotsSaturationBoost:e.stripeDots.saturationBoost,stripeBorderEnabled:e.stripeBorder.enabled,stripeBorderMinWidthPx:e.stripeBorder.minWidthPx,stripeBorderDensity:e.stripeBorder.density,gridLinesEnabled:e.gridLines.enabled,gridLinesBrightness:e.gridLines.brightness,gridLinesDensity:e.gridLines.density,edgeMaskEnabled:fi(e)==="stripe",edgeMaskStart:e.edgeMask.start,edgeMaskEnd:e.edgeMask.end,edgeMaskPower:e.edgeMask.power,edgeMaskSides:[+!!e.edgeMask.sides.left,+!!e.edgeMask.sides.right,+!!e.edgeMask.sides.bottom,+!!e.edgeMask.sides.top],shuffleEnabled:e.sparkle.width.enabled,shuffleCoverage:e.sparkle.width.coverage,shufflePeriodMin:e.sparkle.width.swingPeriodMin,shufflePeriodMax:e.sparkle.width.swingPeriodMax,shuffleSwingPx:e.sparkle.width.swingPx,motionEnabled:e.sparkle.motion.enabled,motionAmplitudePx:e.sparkle.motion.amplitudePx,motionStaggerPx:e.sparkle.motion.staggerPx,motionMaxOffsetPx:e.sparkle.motion.maxOffsetPx,motionSpeed:e.sparkle.motion.speed,lettersEnabled:t.lettersEnabled,glyphDataTex:t.glyphDataTex,atlasTex:t.atlasTex,atlasGrid:t.atlasGrid,letterSizeScale:e.letters.sizeScale,letterColor:e.letters.color,useCellColors:t.colorsMode,cellColorTex:t.cellColorTex,imageColorLightness:e.colors.imageColorLightness,imageColorDensity:e.colors.imageColorDensity,opacityTex:t.opacityTex,bandValueTex:t.bandValueTex,stripeBandCount:t.stripeBandCount,contourFieldEnabled:t.contourFieldTex!==null,contourFieldTex:t.contourFieldTex,contourMinCssPx:t.contourMinCssPx,cellDataA:t.cellDataA,cellDataB:t.cellDataB,blendMode:Vl[e.colors.stripeBlendMode],gradientEnabled:e.colors.gradient.enabled,gradientDirection:xn(e.colors.gradient.direction),gradientStopCount:e.colors.gradient.stopCount,gradientStops:e.colors.gradient.stops,gradientHueDriftDeg:e.colors.gradient.hueDriftDeg,gradientSaturationBoost:e.colors.gradient.saturationBoost}}function ru(e,t){let a=V(e,Q,au),r=i=>e.getUniformLocation(a,i),n=di(e,a),o={cellDataA:r("uCellDataA"),cellDataB:r("uCellDataB"),useCellData:r("uUseCellData"),gridGap:r("uGridGapPx"),corner:r("uCorner"),orient:r("uOrient"),angleDeg:r("uAngleDeg"),rotationMode:r("uRotationMode"),overlapAmount:r("uOverlapAmount"),streamGapWaveEnabled:r("uStreamGapWaveEnabled"),streamGapWaveSqueeze:r("uStreamGapWaveSqueeze"),streamGapWaveWavelengthCells:r("uStreamGapWaveWavelengthCells"),streamGapWaveSpeed:r("uStreamGapWaveSpeed"),streamGapWavePhaseDeg:r("uStreamGapWavePhaseDeg"),bg:r("uBg"),bgAlpha:r("uBgAlpha"),transparent:r("uTransparent"),bgGradientEnabled:r("uBgGradientEnabled"),bgGradientDirection:r("uBgGradientDirection"),bgGradientStopCount:r("uBgGradientStopCount"),bgGradientStop0:r("uBgGradientStop0"),bgGradientStop1:r("uBgGradientStop1"),bgGradientStop2:r("uBgGradientStop2"),bgGradientStop3:r("uBgGradientStop3"),bgGridEnabled:r("uBgGridEnabled"),bgGridCellPx:r("uBgGridCellPx"),bgGridGapPx:r("uBgGridGapPx"),bgGridCorner:r("uBgGridCorner"),bgGridColor:r("uBgGridColor"),bgGridOpacity:r("uBgGridOpacity"),displayPx:r("uDisplayPx"),dpr:r("uDpr"),stripeDotsEnabled:r("uStripeDotsEnabled"),stripeDotsSizePx:r("uStripeDotsSizePx"),stripeDotsRandomVisibility:r("uStripeDotsRandomVisibility"),stripeDotsBrightness:r("uStripeDotsBrightness"),stripeDotsHueDriftDeg:r("uStripeDotsHueDriftDeg"),stripeDotsSaturationBoost:r("uStripeDotsSaturationBoost"),stripeBorderEnabled:r("uStripeBorderEnabled"),stripeBorderMinWidthPx:r("uStripeBorderMinWidthPx"),stripeBorderDensity:r("uStripeBorderDensity"),gridLinesEnabled:r("uGridLinesEnabled"),gridLinesBrightness:r("uGridLinesBrightness"),gridLinesDensity:r("uGridLinesDensity"),lettersEnabled:r("uLettersEnabled"),glyphData:r("uGlyphData"),atlas:r("uAtlas"),atlasGrid:r("uAtlasGrid"),letterSizeScale:r("uLetterSizeScale"),letterColor:r("uLetterColor"),blendMode:r("uBlendMode")},l=(i,s)=>e.uniform3f(i,...Ce(s));return{render(i,s,u,f,c,m=null,g=0,b=0){m?X(e,m):(e.bindFramebuffer(e.FRAMEBUFFER,null),e.viewport(g,b,f,c),void 0),e.useProgram(a),hi(e,n,u,i,s);let S=!!u.cellDataA&&!!u.cellDataB;e.uniform1f(o.useCellData,+!!S),S&&(e.activeTexture(e.TEXTURE6),e.bindTexture(e.TEXTURE_2D,u.cellDataA),e.uniform1i(o.cellDataA,6),e.activeTexture(e.TEXTURE7),e.bindTexture(e.TEXTURE_2D,u.cellDataB),e.uniform1i(o.cellDataB,7)),e.uniform2f(o.gridGap,u.gapX,u.gapY),e.uniform1f(o.corner,u.cornerRadius),e.uniform1f(o.orient,u.orientation),e.uniform1f(o.angleDeg,u.angleDeg),e.uniform1f(o.rotationMode,u.rotationMode),e.uniform1f(o.overlapAmount,u.overlapAmount),e.uniform1f(o.streamGapWaveEnabled,+!!u.streamGapWaveEnabled),e.uniform1f(o.streamGapWaveSqueeze,u.streamGapWaveSqueeze),e.uniform1f(o.streamGapWaveWavelengthCells,u.streamGapWaveWavelengthCells),e.uniform1f(o.streamGapWaveSpeed,u.streamGapWaveSpeed),e.uniform1f(o.streamGapWavePhaseDeg,u.streamGapWavePhaseDeg),l(o.bg,u.background),e.uniform1f(o.bgAlpha,u.backgroundAlpha),e.uniform1f(o.transparent,+!!u.transparent),e.uniform1f(o.bgGradientEnabled,+!!u.backgroundGradientEnabled),e.uniform1f(o.bgGradientDirection,u.backgroundGradientDirection),e.uniform1f(o.bgGradientStopCount,u.backgroundGradientStopCount),l(o.bgGradientStop0,u.backgroundGradientStops[0]),l(o.bgGradientStop1,u.backgroundGradientStops[1]),l(o.bgGradientStop2,u.backgroundGradientStops[2]),l(o.bgGradientStop3,u.backgroundGradientStops[3]),e.uniform1f(o.bgGridEnabled,+!!u.backgroundGridEnabled),e.uniform2f(o.bgGridCellPx,u.backgroundGridCellW,u.backgroundGridCellH),e.uniform2f(o.bgGridGapPx,u.backgroundGridGapX,u.backgroundGridGapY),e.uniform1f(o.bgGridCorner,u.backgroundGridCornerRadius),l(o.bgGridColor,u.backgroundGridColor),e.uniform1f(o.bgGridOpacity,u.backgroundGridOpacity),e.uniform2f(o.displayPx,u.displayW,u.displayH),e.uniform1f(o.dpr,u.dpr),e.uniform1f(o.stripeDotsEnabled,+!!u.stripeDotsEnabled),e.uniform1f(o.stripeDotsSizePx,u.stripeDotsSizePx),e.uniform1f(o.stripeDotsRandomVisibility,u.stripeDotsRandomVisibility),e.uniform1f(o.stripeDotsBrightness,u.stripeDotsBrightness),e.uniform1f(o.stripeDotsHueDriftDeg,u.stripeDotsHueDriftDeg),e.uniform1f(o.stripeDotsSaturationBoost,u.stripeDotsSaturationBoost),e.uniform1f(o.stripeBorderEnabled,+!!u.stripeBorderEnabled),e.uniform1f(o.stripeBorderMinWidthPx,u.stripeBorderMinWidthPx),e.uniform1f(o.stripeBorderDensity,u.stripeBorderDensity),e.uniform1f(o.gridLinesEnabled,+!!u.gridLinesEnabled),e.uniform1f(o.gridLinesBrightness,u.gridLinesBrightness),e.uniform1f(o.gridLinesDensity,u.gridLinesDensity),e.uniform1f(o.lettersEnabled,+!!u.lettersEnabled),e.activeTexture(e.TEXTURE2),e.bindTexture(e.TEXTURE_2D,u.glyphDataTex),e.uniform1i(o.glyphData,2),e.activeTexture(e.TEXTURE3),e.bindTexture(e.TEXTURE_2D,u.atlasTex),e.uniform1i(o.atlas,3),e.uniform2f(o.atlasGrid,u.atlasGrid[0],u.atlasGrid[1]),e.uniform1f(o.letterSizeScale,u.letterSizeScale),l(o.letterColor,u.letterColor),e.uniform1f(o.blendMode,u.blendMode),t.draw()},dispose(){e.deleteProgram(a)}}}var nu=`#version 300 es
precision highp float;
in vec2 vUv;
${ci}
layout(location = 0) out vec4 outCellA;
layout(location = 1) out vec4 outCellB;

void main() {
  vec2 cell = floor(vUv * uGridCount);
  CellData d = cellData(cell);
  outCellA = vec4(d.color, d.widthPx);
  outCellB = vec4(d.opacity, d.rampT, d.dotEligible, randomColumnMotionOffset(cell.x));
}
`;function ou(e,t){let a=V(e,Q,nu),r=di(e,a);return{render(n,o,l,i,s,u){Lr(e,n,[o,l]),e.useProgram(a),hi(e,r,u,i,s),t.draw()},dispose(){e.deleteProgram(a)}}}var Rn=10,iu=48;function pi(e){return Math.max(0,Math.min(1,e))}function lu(e){let t=1-pi(e);return 1-t*t*t*t}function su(e){return Math.max(0,1-e)**.45}function uu(e,t){let a=1.35-.35*t;return su(e)*a}function br(e,t,a){let r=pi(t),n=lu(r),o=1-r;return{x:e.x,y:e.y,radius:a.startRadiusPx+(a.maxRadiusPx-a.startRadiusPx)*n,strokeWidth:Math.max(a.endStrokeWidthPx,a.startStrokeWidthPx+(a.endStrokeWidthPx-a.startStrokeWidthPx)*r),waveProgress:r,pushPower:o*o*(3-2*o),whitePower:uu(r,n),seed:e.seed}}function ir(){return{waves:[],clearFramesRemaining:0,nextSeed:1}}function cu(e,t,a){e.waves.push({x:t.x,y:t.y,ageMs:0,lifeMs:Math.max(1,a),seed:e.nextSeed++})}function fu(e,t,a=fe){let r=ei(a),n=Math.max(0,Math.min(iu,t||16.67)),o=e.waves.length>0;if(!r.enabled){e.waves=[],o&&(e.clearFramesRemaining=Rn);let u=e.clearFramesRemaining>0;return u&&e.clearFramesRemaining--,{samples:[],changed:u}}e.waves.length>r.maxWaves&&e.waves.splice(0,e.waves.length-r.maxWaves);let l=[],i=[];for(let u of e.waves){let f=u.ageMs+n;if(f>=u.lifeMs)continue;let c=f/u.lifeMs;i.push({...u,ageMs:f}),l.push(br(u,c,r))}e.waves=i,o&&i.length===0&&(e.clearFramesRemaining=Rn);let s=l.length===0&&e.clearFramesRemaining>0;return s&&e.clearFramesRemaining--,{samples:l,changed:l.length>0||s}}var Ur=`
float clickWobbleAmplitude(float radius) {
  return max(1.0, radius * 0.18);
}

float clickRadiusWobble(float seed, float angle, float progress, float amplitude) {
  float spin = progress * 6.28318530718;
  return amplitude * (
    sin(angle * 3.0 + seed * 0.71 + spin * 0.35) * 0.38 +
    sin(angle * 6.0 + seed * 1.19 - spin * 0.55) * 0.32 +
    sin(angle * 11.0 + seed * 2.07 + spin) * 0.22
  );
}
`,Ta=`
vec2 capPush(vec2 p, float cap) {
  float L = length(p);
  return L > cap ? p * (cap / L) : p;
}

float cursorCoverage(float field, float tear, float brighten) {
  field *= (1.0 - tear);
  field += (1.0 - field) * brighten;
  return clamp(field, 0.0, 1.0);
}
`,du=`#version 300 es
precision highp float;
${Ur}
${Ta}

uniform sampler2D uPreviousA;
uniform sampler2D uPreviousB;
uniform sampler2D uIncomingA;
uniform sampler2D uIncomingB;
uniform sampler2D uAccum;
uniform sampler2D uTear;
uniform vec3 uWave;
uniform float uProgress;
uniform float uPushCap;
uniform float uDrawableWidth;
uniform float uCellSpread;
in vec2 vUv;
layout(location = 0) out vec4 outCellA;
layout(location = 1) out vec4 outCellB;

const float CELL_SPREAD_BLOCK = ${16 .toFixed(1)};

highp uint pcg(highp uint v) {
  v = v * 747796405u + 2891336453u;
  highp uint s = ((v >> ((v >> 28) + 4u)) ^ v) * 277803737u;
  return (s >> 22) ^ s;
}

highp float hashBlock(highp uint i, highp uint salt) {
  return float(pcg(i * 747796405u + salt)) * (1.0 / 4294967296.0);
}

void main() {
  ivec2 grid = textureSize(uIncomingA, 0);
  ivec2 cell = clamp(ivec2(floor(vUv * vec2(grid))), ivec2(0), grid - 1);
  // Cell materials use bottom-up rows; the normal click accumulator is top-down.
  ivec2 clickCell = ivec2(cell.x, grid.y - 1 - cell.y);
  vec4 accum = texelFetch(uAccum, clickCell, 0);
  vec2 push = capPush(accum.gb, uPushCap);
  float tear = texelFetch(uTear, clickCell, 0).r;
  float brighten = clamp(accum.r, 0.0, 1.0);
  vec2 sourceCell = vec2(cell) + vec2(0.5) - vec2(push.x, -push.y);
  ivec2 warpedCell = clamp(ivec2(floor(sourceCell)), ivec2(0), grid - 1);
  vec4 previousA = texelFetch(uPreviousA, warpedCell, 0);
  vec4 previousB = texelFetch(uPreviousB, warpedCell, 0);
  vec4 incomingA = texelFetch(uIncomingA, warpedCell, 0);
  vec4 incomingB = texelFetch(uIncomingB, warpedCell, 0);

  vec2 delta = vec2(clickCell) - push - vec2(grid) * 0.5;
  float angle = atan(delta.y, delta.x);
  float radius = uWave.x + clickRadiusWobble(uWave.z, angle, uProgress, clickWobbleAmplitude(uWave.x));
  float feather = max(1.0, uWave.y);
  // Each block meets the front later by its own share of uCellSpread, so the
  // artwork breaks into staggered particles instead of one image that inflates.
  vec2 blockGrid = ceil(vec2(grid) / CELL_SPREAD_BLOCK);
  vec2 block = floor(vec2(clickCell) / CELL_SPREAD_BLOCK);
  float lead = uCellSpread * hashBlock(uint(block.y * blockGrid.x + block.x), uint(uWave.z));
  // The front owns replacement; its fading brightness never restores old color.
  float localBlend = 1.0 - smoothstep(radius - feather, radius + feather, length(delta) + lead);
  vec2 endpointBlend = vec2(1.0 - localBlend, localBlend);
  vec2 visible = step(vec2(0.5), vec2(previousA.a, incomingA.a));
  vec2 coverage = endpointBlend * visible * clamp(vec2(previousB.r, incomingB.r), 0.0, 1.0);
  float opacity = coverage.x + coverage.y;
  // Hidden cells retain authored material for coverage made by the normal click.
  vec2 weights = opacity > 0.0 ? coverage / opacity : endpointBlend;
  vec3 color = previousA.rgb * weights.x + incomingA.rgb * weights.y;
  float width = opacity > 0.0 ? dot(max(vec2(previousA.a, incomingA.a), 0.0), weights) : 0.0;
  float ramp = dot(vec2(previousB.g, incomingB.g), weights);
  float eligibility = dot(vec2(previousB.b, incomingB.b), weights);

  // Apply the normal scalar tear/brighten response without whitening authored RGB.
  // Widths beyond the drawable range stay intact when the effect reaches identity.
  float widthLimit = max(width, uDrawableWidth);
  width = cursorCoverage(width / widthLimit, tear, brighten) * widthLimit;
  opacity = cursorCoverage(opacity, tear, brighten);
  ramp = cursorCoverage(ramp, tear, brighten);

  // Column motion stays at its destination, independent of the radial front.
  ivec2 column = ivec2(cell.x, 0);
  float offset = mix(texelFetch(uPreviousB, column, 0).a, texelFetch(uIncomingB, column, 0).a, uProgress);
  outCellA = vec4(color, width);
  outCellB = vec4(opacity, ramp, eligibility, offset);
}
`,hu=`#version 300 es
precision highp float;
in vec2 aCenterCell;
in float aRadiusCell;
in float aHalfStrokeCell;
in float aPushBandCell;
in float aPushPeak;
in float aWhiteAmt;
in float aProgress;
in float aSeed;
uniform vec2 uGridSize;
out vec2 vCenterCell;
out float vRadiusCell;
out float vHalfStrokeCell;
out float vPushBandCell;
out float vPushPeak;
out float vWhiteAmt;
out float vProgress;
out float vSeed;
out float vWobbleAmplitude;
${Ur}
void main() {
  vec2 corner = vec2(
    float(gl_VertexID == 1 || gl_VertexID == 4 || gl_VertexID == 5),
    float(gl_VertexID == 2 || gl_VertexID == 3 || gl_VertexID == 5)
  );
  float wobbleAmplitude = clickWobbleAmplitude(aRadiusCell);
  float reachCell = aRadiusCell + max(aHalfStrokeCell, aPushBandCell) + wobbleAmplitude + 1.0;
  vec2 quadOriginCell = aCenterCell - reachCell;
  vec2 quadSizeCell = vec2(reachCell * 2.0);
  vec2 cell = quadOriginCell + corner * quadSizeCell;
  vec2 uv = cell / uGridSize;
  gl_Position = vec4(uv.x * 2.0 - 1.0, uv.y * 2.0 - 1.0, 0.0, 1.0);
  vCenterCell = aCenterCell;
  vRadiusCell = aRadiusCell;
  vHalfStrokeCell = aHalfStrokeCell;
  vPushBandCell = aPushBandCell;
  vPushPeak = aPushPeak;
  vWhiteAmt = aWhiteAmt;
  vProgress = aProgress;
  vSeed = aSeed;
  vWobbleAmplitude = wobbleAmplitude;
}
`,pu=`#version 300 es
precision highp float;
in vec2 vCenterCell;
in float vRadiusCell;
in float vHalfStrokeCell;
in float vPushBandCell;
in float vPushPeak;
in float vWhiteAmt;
in float vProgress;
in float vSeed;
in float vWobbleAmplitude;
uniform vec2 uGridSize;
out vec4 finalColor;

float clamp01(float v) {
  return clamp(v, 0.0, 1.0);
}

float falloff(float distance, float radius) {
  if (radius <= 0.0 || distance >= radius) {
    return 0.0;
  }
  float t = 1.0 - distance / radius;
  return t * t * (3.0 - 2.0 * t);
}

float clickSeededUnit(float seed, float salt) {
  float x = sin(seed * 12.9898 + salt * 78.233) * 43758.5453;
  return x - floor(x);
}

${Ur}

float clickStrengthBreakup(float seed, float x, float y, float jitter) {
  if (jitter <= 0.0) {
    return 1.0;
  }
  float n1 = clickSeededUnit(seed, x * 0.17 + y * 0.23);
  float n2 = clickSeededUnit(seed, x * 0.41 + y * 0.09 + seed * 0.13);
  float density = n1 * n2;
  return 1.0 - jitter * (1.0 - density);
}

float clickFade(float waveProgress) {
  float t = clamp((waveProgress - 0.8) / 0.2, 0.0, 1.0);
  return 1.0 - t * t * (3.0 - 2.0 * t);
}

const float CLICK_BREAKUP_JITTER = 0.25;
const float CLICK_INTERIOR_FILL = 0.5;

void main() {
  vec2 cell = floor(gl_FragCoord.xy);
  float waveFade = clickFade(vProgress);

  float dx = cell.x - vCenterCell.x;
  float dy = cell.y - vCenterCell.y;
  float distance = sqrt(dx * dx + dy * dy);
  float angle = atan(dy, dx);

  float brighten = 0.0;
  if (vWhiteAmt > 0.0 && vRadiusCell > 0.0) {
    float frontRadius = vRadiusCell + clickRadiusWobble(vSeed, angle, vProgress, vWobbleAmplitude);
    float breakup = clickStrengthBreakup(vSeed, cell.x, cell.y, CLICK_BREAKUP_JITTER);
    float fromFront = distance - frontRadius;
    float radial;
    if (fromFront > vHalfStrokeCell) {
      radial = 0.0;
    } else if (fromFront > 0.0) {
      radial = falloff(fromFront, vHalfStrokeCell);
    } else {
      float interiorT = clamp01(distance / max(0.0001, frontRadius));
      radial = CLICK_INTERIOR_FILL + (1.0 - CLICK_INTERIOR_FILL) * interiorT;
    }
    brighten = clamp01(vWhiteAmt * waveFade * breakup * radial);
  }

  float pushX = 0.0;
  float pushY = 0.0;
  if (vPushPeak > 0.0 && vRadiusCell > 0.0 && distance > 0.0) {
    float reach = vRadiusCell + vWobbleAmplitude + vPushBandCell;
    if (distance < reach) {
      float frontRadius = max(0.5, vRadiusCell + clickRadiusWobble(vSeed, angle, vProgress, vWobbleAmplitude));
      float w;
      if (distance <= frontRadius) {
        float t = distance / frontRadius;
        w = t * t * (3.0 - 2.0 * t);
      } else {
        w = falloff(distance - frontRadius, vPushBandCell);
      }
      float force = vPushPeak * waveFade * w;
      if (force > 0.0) {
        pushX = (dx / distance) * force;
        pushY = (dy / distance) * force;
      }
    }
  }

  if (brighten <= 0.0 && pushX == 0.0 && pushY == 0.0) {
    discard;
  }

  finalColor = vec4(brighten, pushX, pushY, 0.0);
}
`,pa=9,Ze=pa*4;function mi(e){let t=V(e,hu,pu),a=e.createVertexArray();if(!a)throw Error("Failed to create VAO");let r=e.createBuffer();if(!r)throw Error("Failed to create instance buffer");let n=e.getAttribLocation(t,"aCenterCell"),o=e.getAttribLocation(t,"aRadiusCell"),l=e.getAttribLocation(t,"aHalfStrokeCell"),i=e.getAttribLocation(t,"aPushBandCell"),s=e.getAttribLocation(t,"aPushPeak"),u=e.getAttribLocation(t,"aWhiteAmt"),f=e.getAttribLocation(t,"aProgress"),c=e.getAttribLocation(t,"aSeed"),m=e.getUniformLocation(t,"uGridSize");e.bindVertexArray(a),e.bindBuffer(e.ARRAY_BUFFER,r),e.enableVertexAttribArray(n),e.vertexAttribPointer(n,2,e.FLOAT,!1,Ze,0),e.vertexAttribDivisor(n,1),e.enableVertexAttribArray(o),e.vertexAttribPointer(o,1,e.FLOAT,!1,Ze,8),e.vertexAttribDivisor(o,1),e.enableVertexAttribArray(l),e.vertexAttribPointer(l,1,e.FLOAT,!1,Ze,12),e.vertexAttribDivisor(l,1),e.enableVertexAttribArray(i),e.vertexAttribPointer(i,1,e.FLOAT,!1,Ze,16),e.vertexAttribDivisor(i,1),e.enableVertexAttribArray(s),e.vertexAttribPointer(s,1,e.FLOAT,!1,Ze,20),e.vertexAttribDivisor(s,1),e.enableVertexAttribArray(u),e.vertexAttribPointer(u,1,e.FLOAT,!1,Ze,24),e.vertexAttribDivisor(u,1),e.enableVertexAttribArray(f),e.vertexAttribPointer(f,1,e.FLOAT,!1,Ze,28),e.vertexAttribDivisor(f,1),e.enableVertexAttribArray(c),e.vertexAttribPointer(c,1,e.FLOAT,!1,Ze,32),e.vertexAttribDivisor(c,1),e.bindVertexArray(null),e.bindBuffer(e.ARRAY_BUFFER,null);let g=new Float32Array;return{render(b,S,v){if(S.length===0)return;let M=v.displayWidth>0?v.cols/v.displayWidth:1,y=v.displayHeight>0?v.rows/v.displayHeight:1,x=v.displayWidth>0?v.cols/v.displayWidth:1,T=S.length*pa;g.length<T&&(g=new Float32Array(T));let R=0;for(let C=0;C<S.length;C++){let w=S[C],p=Math.max(0,w.radius*x);if(p<=0)continue;let E=w.whitePower*v.stripeWhiteAlpha,D=v.pushScale*w.pushPower;if(E<=0&&D<=0)continue;let L=Math.max(.5,w.strokeWidth*.5*x),H=Math.max(.5,L*v.pushBandScale),U=R*pa;g[U]=w.x*M,g[U+1]=w.y*y,g[U+2]=p,g[U+3]=L,g[U+4]=H,g[U+5]=D,g[U+6]=E,g[U+7]=w.waveProgress,g[U+8]=w.seed,R++}R!==0&&(X(e,b),e.useProgram(t),e.uniform2f(m,v.cols,v.rows),e.bindVertexArray(a),e.bindBuffer(e.ARRAY_BUFFER,r),e.bufferData(e.ARRAY_BUFFER,g.subarray(0,R*pa),e.DYNAMIC_DRAW),e.bindBuffer(e.ARRAY_BUFFER,null),e.enable(e.BLEND),e.blendFunc(e.ONE,e.ONE),e.drawArraysInstanced(e.TRIANGLES,0,6,R),e.disable(e.BLEND),e.bindVertexArray(null))},dispose(){e.deleteProgram(t),e.deleteVertexArray(a),e.deleteBuffer(r)}}}var mu=`#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uAccum;
uniform vec2 uTexel;
uniform float uTearStrength;
uniform float uPushCap;
out vec4 finalColor;

${Ta}

void main() {
  vec2 pushRight = capPush(texture(uAccum, vUv + vec2(uTexel.x, 0.0)).gb, uPushCap);
  vec2 pushLeft = capPush(texture(uAccum, vUv - vec2(uTexel.x, 0.0)).gb, uPushCap);
  vec2 pushDown = capPush(texture(uAccum, vUv + vec2(0.0, uTexel.y)).gb, uPushCap);
  vec2 pushUp = capPush(texture(uAccum, vUv - vec2(0.0, uTexel.y)).gb, uPushCap);

  float divergence = (pushRight.x - pushLeft.x) + (pushDown.y - pushUp.y);
  float tear = clamp(uTearStrength * max(0.0, divergence), 0.0, 1.0);

  finalColor = vec4(tear, 0.0, 0.0, 1.0);
}
`,gu=.6;function gi(e,t){let a=V(e,Q,mu),r=e.getUniformLocation(a,"uAccum"),n=e.getUniformLocation(a,"uTexel"),o=e.getUniformLocation(a,"uTearStrength"),l=e.getUniformLocation(a,"uPushCap");return{render(i,s,u){X(e,i),e.useProgram(a),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,s),e.uniform1i(r,0),e.uniform2f(n,u.cols>0?1/u.cols:0,u.rows>0?1/u.rows:0),e.uniform1f(o,gu),e.uniform1f(l,u.pushCap),t.draw()},dispose(){e.deleteProgram(a)}}}function vu(e,t){let a=mi(e),r=gi(e,t),n=V(e,Q,du),o=xr(e),l=["uPreviousA","uPreviousB","uIncomingA","uIncomingB","uAccum","uTear"].map(b=>e.getUniformLocation(n,b)),i=e.getUniformLocation(n,"uWave"),s=e.getUniformLocation(n,"uProgress"),u=e.getUniformLocation(n,"uPushCap"),f=e.getUniformLocation(n,"uDrawableWidth"),c=e.getUniformLocation(n,"uCellSpread"),m=null,g=null;return{render(b,S,v,M){let{width:y,height:x}=S[0];(!m||!g||m.width!==y||m.height!==x)&&(m&&Ye(e,m),g&&Ye(e,g),m=rt(e,y,x,{float:!0}),g=rt(e,y,x));let T=y/M.cssW,R=M.config.pushStrengthPx*T,C=Math.min(6,R);X(e,m),e.clearColor(0,0,0,0),e.clear(e.COLOR_BUFFER_BIT),a.render(m,[M.sample],{cols:y,rows:x,displayWidth:M.cssW,displayHeight:M.cssH,pushScale:R,pushBandScale:M.config.pushBandScale,stripeWhiteAlpha:M.config.stripeWhiteAlpha}),r.render(g,m.texture,{cols:y,rows:x,pushCap:C});let w=[...b,...S,m,g];if(v[0].texture===v[1].texture||v.some(p=>w.some(E=>p.texture===E.texture)))throw Error("Cell click outputs must be distinct from each other and all sampled textures");Lr(e,o,[v[0],v[1]]),e.useProgram(n);for(let p=0;p<w.length;p++)e.activeTexture(e.TEXTURE0+p),e.bindTexture(e.TEXTURE_2D,w[p].texture),e.uniform1i(l[p],p);return e.uniform3f(i,M.sample.radius*T,Math.max(.5,M.sample.strokeWidth*.5*T),M.sample.seed),e.uniform1f(s,M.sample.waveProgress),e.uniform1f(u,C),e.uniform1f(f,M.drawableWidth),e.uniform1f(c,M.cellSpread),t.draw(),e.bindFramebuffer(e.FRAMEBUFFER,null),e.activeTexture(e.TEXTURE0),v},dispose(){m&&Ye(e,m),g&&Ye(e,g),a.dispose(),r.dispose(),o.dispose(),e.deleteProgram(n)}}}var Kh=["click-wave"],_t={depart:1,arrive:1,split:.35,ramp:.25,travelPx:20};function En(e,t){let a=r=>[r.grid,r.background,r.sparkle.width,r.sparkle.motion,r.stripeDots,r.stripeBorder,r.gridLines,r.colors.stripeBlendMode];return e.stripesEnabled&&t.stripesEnabled&&e.renderMode==="sharp"&&t.renderMode==="sharp"&&!e.letters.enabled&&!t.letters.enabled&&!e.sparkle.motion.enabled&&!t.sparkle.motion.enabled&&Math.abs(e.grid.angleDeg%90)<.001&&Math.abs(t.grid.angleDeg%90)<.001&&JSON.stringify(a(e))===JSON.stringify(a(t))}function xu(e,t){return e.colors.mode===t.colors.mode&&e.flames.enabled===t.flames.enabled&&e.background.stars.enabled===t.background.stars.enabled&&e.fieldScale===t.fieldScale}var An=e=>Math.min(1,Math.max(0,e));function bu(e,t){let a=vu(e,t),r=null,n=null,o=null,l=null,i=0,s=!1,u=1,f=1,c=1,m=0,g=null,b=0,S=(x,T)=>[rt(e,x,T,{float32:!0}),rt(e,x,T,{float32:!0})],v=x=>{if(x)for(let T of x)Ye(e,T)},M=(x,T)=>{x!==T&&(e.bindFramebuffer(e.READ_FRAMEBUFFER,x.fbo),e.bindFramebuffer(e.DRAW_FRAMEBUFFER,T.fbo),e.blitFramebuffer(0,0,x.width,x.height,0,0,T.width,T.height,e.COLOR_BUFFER_BIT,e.NEAREST))},y=x=>{if(s){if(l=(l??x)+i,i=0,x<l)return null;l=x,s=!1}let T=x-(l??x);return T<0?null:T};return{get active(){return o!==null},get liveOutgoing(){return o!==null&&g!==null},capture(x,T,R,C,w){let{width:p,height:E}=x[0];(!r||r[0].width!==p||r[0].height!==E)&&(v(r),r=S(p,E)),M(x[0],r[0]),M(x[1],r[1]),e.bindFramebuffer(e.FRAMEBUFFER,null),u=Math.max(1,C),f=Math.max(1,w),c=Math.max(.5,R.cellWidth-R.gapX);let D=p/u,L=Math.max(1,fe.startStrokeWidthPx*.5*D),H=Math.hypot(p,E)*.5;m=Math.min(4,Math.max(0,T.cellSpread??0))*16;let U=T.flameStagger;g=U?{depart:An(U.depart??_t.depart),arrive:An(U.arrive??_t.arrive),split:Math.min(.9,Math.max(.1,U.split??_t.split)),ramp:Math.min(.9,Math.max(.02,U.ramp??_t.ramp)),travelPx:Math.max(0,U.travelPx??_t.travelPx)}:null;let A=(H+6+L+1+m)/.82,ee=br({x:0,y:0,seed:0},.8,{...fe,startRadiusPx:0,maxRadiusPx:1}).radius;o={...fe,enabled:!0,lifeMs:Math.max(1,T.durationMs??fe.lifeMs),pushStrengthPx:fe.pushStrengthPx*1.5,maxRadiusPx:A/(D*ee)},l=T.startAtMs??null,i=Math.max(0,T.delayMs??0),s=!0,b++},cancel(){o=null,g=null},flameStaggerAt(x,T){if(!o||!g)return null;let R=y(x);if(R===null||R>=o.lifeMs)return null;let{depart:C,arrive:w,split:p,ramp:E,travelPx:D}=g,L={progress:R/o.lifeMs,ramp:E,travelPx:D,centerX:u/2,centerY:f/2};return T?{...L,from:0,to:p,spread:C,outgoing:T}:{...L,from:p,to:1,spread:w,outgoing:T}},captureLive(x){if(!r)return!1;let{width:T,height:R}=x[0];return r[0].width!==T||r[0].height!==R?!1:(M(x[0],r[0]),M(x[1],r[1]),e.bindFramebuffer(e.FRAMEBUFFER,null),!0)},render(x,T,R,C){if(!o||!r)return x;let{width:w,height:p}=x[0];if(r[0].width!==w||r[0].height!==p||u!==Math.max(1,R)||f!==Math.max(1,C))return this.cancel(),x;let E=y(T);return E===null?r:E>=o.lifeMs?(this.cancel(),x):((!n||n[0].width!==w||n[0].height!==p)&&(v(n),n=S(w,p)),a.render(r,x,n,{config:o,sample:br({x:u/2,y:f/2,seed:b},E/o.lifeMs,o),cssW:u,cssH:f,drawableWidth:c,cellSpread:m}))},dispose(){v(r),v(n),a.dispose()}}}var Te=`#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uTex;
uniform sampler2D uStripes;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uTime;
uniform float uIntensity;
uniform vec2 uResolution;
uniform float uDpr;
uniform vec4 uParams;
out vec4 fragColor;

float hash21(vec2 p){ p = fract(p * vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x * p.y); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i), b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0)), d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ s += a * vnoise(p); p *= 2.0; a *= 0.5; } return s; }
vec2 warp(vec2 uv, vec2 freq, float scale, float t){
  float nx = fbm(uv * freq + vec2(0.0, t));
  float ny = fbm(uv * freq + vec2(5.2, 1.3) - vec2(t, 0.0));
  return uv + (vec2(nx, ny) - 0.5) * scale;
}
float grain(vec2 uv, float t){ return hash21(uv * uResolution + t); }
float luma(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }
vec3 blurTex(vec2 uv, float px){
  vec2 o = px / uResolution;
  vec3 s = texture(uTex, uv).rgb * 0.4;
  s += texture(uTex, uv + vec2(o.x, 0.0)).rgb * 0.15;
  s += texture(uTex, uv - vec2(o.x, 0.0)).rgb * 0.15;
  s += texture(uTex, uv + vec2(0.0, o.y)).rgb * 0.15;
  s += texture(uTex, uv - vec2(0.0, o.y)).rgb * 0.15;
  return s;
}
`,Su=Te+`
void main(){
  float amp = mix(1.5, 10.0, uParams.x) * uDpr;
  float grainAmt = uParams.y;
  float freq = mix(3.0, 14.0, uParams.z);
  float colW = 7.0 * uDpr;
  float colId = floor(vUv.x * uResolution.x / colW);
  float dur = mix(0.6, 3.0, hash21(vec2(colId, 1.0)));
  float tick = floor(uTime / dur + hash21(vec2(colId, 2.0)) * 13.0);
  float seed = hash21(vec2(colId, tick)) * 30.0;
  float dx = (fbm(vec2(vUv.y * freq + seed, seed * 0.7)) - 0.5) * amp;
  float dy = (fbm(vec2(vUv.x * 10.0, vUv.y * freq * 0.5 + seed)) - 0.5) * amp * 0.4;
  vec2 uv = vUv + vec2(dx, dy) / uResolution;
  vec3 c = texture(uStripes, uv).rgb;
  float paper = mix(fbm(vUv * uResolution / 3.0), hash21(floor(vUv * uResolution / 1.5)), 0.5);
  c *= mix(1.0, 0.8 + 0.4 * paper, grainAmt * 0.5);
  fragColor = vec4(mix(texture(uStripes, vUv).rgb, c, uIntensity), 1.0);
}
`,yu=Te+`
void main(){
  float t = uTime * 0.25;
  float grainAmt = uParams.x;
  float smudgeAmt = uParams.y;
  float dark = mix(0.3, 0.9, uParams.z);
  vec2 uv = warp(vUv, vec2(50.0, 70.0), 0.025 * uIntensity, t);
  vec3 c = texture(uTex, uv).rgb;
  float grit = mix(fbm(vUv * uResolution / 2.5), hash21(floor(vUv * uResolution / 1.2)), 0.6);
  c *= mix(1.0, (1.0 - dark) + (dark + 0.2) * grit, grainAmt * uIntensity);
  float smear = fbm(vec2(vUv.x * 40.0, vUv.y * 8.0) + t);
  c *= mix(1.0, 0.7 + 0.4 * smear, smudgeAmt * 0.4 * uIntensity);
  fragColor = vec4(c, 1.0);
}
`,Mu=Te+`
void main(){
  vec2 pp = vUv * uResolution;
  float density = mix(0.25, 0.7, uParams.x);
  float pressure = uParams.y;
  float paperAmt = uParams.z;
  vec3 tone = vec3(0.0);
  for (int i = -2; i <= 2; i++) {
    for (int j = -2; j <= 2; j++) {
      tone += texture(uTex, vUv + vec2(float(i), float(j)) * 3.0 / uResolution).rgb;
    }
  }
  tone /= 25.0;
  float ink = clamp((1.0 - luma(tone)) * (0.7 + 0.8 * pressure), 0.0, 1.0);
  float l = luma(texture(uTex, vUv).rgb);
  float lx = luma(texture(uTex, vUv + vec2(2.5, 0.0) / uResolution).rgb);
  float ly = luma(texture(uTex, vUv + vec2(0.0, 2.5) / uResolution).rgb);
  float wob = fbm(vUv * 40.0) - 0.5;
  float edge = abs(l - lx) + abs(l - ly);
  float outline = smoothstep(0.12, 0.3, edge + wob * 0.05);
  float freq = mix(0.1, 0.26, density);
  float hw = fbm(vUv * 24.0) * 1.4;
  float h1 = smoothstep(0.42, 0.3, abs(sin((pp.x * 0.7 + pp.y * 0.7) * freq + hw)));
  float h2 = smoothstep(0.42, 0.3, abs(sin((pp.x * 0.7 - pp.y * 0.7) * freq + hw)));
  float hatch = h1 * step(0.32, ink);
  hatch = max(hatch, h2 * step(0.6, ink));
  hatch *= smoothstep(0.05, 0.25, ink);
  float cover = max(outline, hatch * 0.75);
  float grain = hash21(floor(pp / 1.5));
  cover *= mix(1.0, 0.55 + 0.45 * grain, paperAmt);
  vec3 outc = mix(uColorB, uColorA, clamp(cover, 0.0, 1.0));
  fragColor = vec4(mix(texture(uTex, vUv).rgb, outc, uIntensity), 1.0);
}
`,wu=Te+`
void main(){
  float strokeAmt = uParams.x;
  float bristleAmt = uParams.y;
  float impasto = uParams.z;
  float strokeLen = mix(0.5, 16.0, strokeAmt) * uDpr;
  float ang = (fbm(vUv * 2.5) - 0.5) * 3.14159;
  vec2 dir = vec2(cos(ang), sin(ang));
  vec2 perp = vec2(-dir.y, dir.x);
  vec3 col = vec3(0.0);
  float wsum = 0.0;
  for (int i = -5; i <= 5; i++) {
    float w = 1.0 - abs(float(i)) / 6.0;
    col += texture(uTex, vUv + dir * float(i) * strokeLen / uResolution).rgb * w;
    wsum += w;
  }
  col /= wsum;
  vec2 sp = vUv * uResolution;
  float bristle = fbm(vec2(dot(sp, perp) * 0.5, dot(sp, dir) * 0.04));
  col *= mix(1.0, 0.72 + 0.45 * bristle, bristleAmt);
  col += smoothstep(0.72, 1.0, bristle) * impasto * 0.22;
  fragColor = vec4(mix(texture(uTex, vUv).rgb, col, uIntensity), 1.0);
}
`,Pu=Te+`
void main(){
  vec3 here = texture(uTex, vUv).rgb;
  float cell = mix(2.0, 22.0, uParams.x) * uDpr;
  float square = uParams.y;
  vec2 cells = uResolution / cell;
  vec2 gp = vUv * cells;
  vec2 cellOrigin = floor(gp);
  vec3 src = vec3(0.0);
  for (int sx = 0; sx < 4; sx++) {
    for (int sy = 0; sy < 4; sy++) {
      vec2 s = (cellOrigin + (vec2(float(sx), float(sy)) + 0.5) / 4.0) / cells;
      src += texture(uTex, s).rgb;
    }
  }
  src /= 16.0;
  float ink = clamp((1.0 - luma(src)) * 1.3, 0.0, 1.0);
  float rad = sqrt(ink) * 0.85;
  vec2 f = abs(fract(gp) - 0.5);
  float d = mix(length(f), max(f.x, f.y), square);
  float dotm = smoothstep(rad + 0.06, rad - 0.06, d);
  vec3 outc = mix(vec3(0.97), src, dotm);
  fragColor = vec4(mix(here, outc, uIntensity), 1.0);
}
`,Cu=Te+`
void main(){
  float t = uTime * 0.3;
  float mis = mix(2.0, 12.0, uParams.x);
  float hue = uParams.y;
  float cell = 3.0 * uDpr;
  vec2 cells = uResolution / cell;
  vec2 o = (vec2(mis, mis * 0.8) / uResolution) * (1.0 + 0.5 * sin(t * 2.0));
  vec3 a = texture(uTex, (floor((vUv - o) * cells) + 0.5) / cells).rgb;
  vec3 b = texture(uTex, (floor((vUv + o) * cells) + 0.5) / cells).rgb;
  vec3 ink2col = mix(vec3(0.1, 0.5, 0.9), vec3(0.2, 0.8, 0.4), hue);
  vec3 ink1 = mix(vec3(1.0), vec3(1.0, 0.45, 0.1), 1.0 - luma(a));
  vec3 ink2 = mix(vec3(1.0), ink2col, 1.0 - luma(b));
  vec3 c = ink1 * ink2;
  fragColor = vec4(mix(texture(uTex, vUv).rgb, c, uIntensity), 1.0);
}
`,Tu=Te+`
void main(){
  float cellSize = mix(6.0, 60.0, uParams.x) * uDpr;
  float lead = mix(0.30, 0.46, uParams.y);
  float sat = mix(1.0, 2.2, uParams.z);
  float gridOp = uParams.w;
  vec2 cells = uResolution / cellSize;
  vec2 gp = vUv * cells;
  vec2 jit = vec2(fbm(floor(gp) * 1.3), fbm(floor(gp) * 2.1)) * 0.3;
  vec2 center = (floor(gp + jit) + 0.5) / cells;
  vec3 col = texture(uTex, center).rgb;
  float l = luma(col);
  col = mix(vec3(l), col, sat);
  vec2 f = abs(fract(gp + jit) - 0.5);
  float pane = smoothstep(0.5, 0.5 - lead * 0.3, max(f.x, f.y));
  vec3 leaded = mix(vec3(0.02), col, pane);
  vec3 outc = mix(col, leaded, gridOp);
  fragColor = vec4(mix(texture(uTex, vUv).rgb, outc, uIntensity), 1.0);
}
`,Ru=Te+`
void main(){
  float t = uTime * 0.2;
  float shadowAmt = uParams.x;
  float levels = mix(3.0, 8.0, uParams.y);
  float rough = uParams.z;
  vec2 uv = warp(vUv, vec2(40.0, 60.0), mix(0.004, 0.014, rough) * uIntensity, t);
  float cell = 4.0 * uDpr;
  vec2 cells = uResolution / cell;
  vec3 c = texture(uTex, (floor(uv * cells) + 0.5) / cells).rgb;
  vec2 sh = vec2(8.0, 8.0) / uResolution;
  float hereInk = 1.0 - luma(c);
  float overInk = 1.0 - luma(texture(uTex, (floor((uv - sh) * cells) + 0.5) / cells).rgb);
  float shadow = clamp(overInk - hereInk, 0.0, 1.0);
  c = mix(c, c * 0.4, shadow * shadowAmt * uIntensity);
  vec3 post = floor(c * levels + 0.5) / levels;
  c = mix(c, post, uIntensity);
  fragColor = vec4(c, 1.0);
}
`,Eu=Te+`
void main(){
  float t = uTime;
  vec2 px = vUv * uResolution;
  float scanAmt = uParams.x;
  float ab = mix(0.0, 30.0, uParams.y);
  float bloomAmt = uParams.z;
  float sp = ab / uResolution.x;
  vec3 c;
  c.r = texture(uTex, vUv + vec2(sp, 0.0)).r;
  c.g = texture(uTex, vUv).g;
  c.b = texture(uTex, vUv - vec2(sp, 0.0)).b;
  float scan = 0.5 + 0.5 * sin((px.y / 1.6 - t * 3.0) * 6.28318);
  c *= mix(1.0, 0.35 + 0.65 * scan, scanAmt * uIntensity);
  float col = mod(floor(px.x / (1.5 * uDpr)), 3.0);
  vec3 mask = vec3(0.7);
  if (col < 0.5) mask.r = 1.0; else if (col < 1.5) mask.g = 1.0; else mask.b = 1.0;
  c *= mix(vec3(1.0), mask, 0.5 * uIntensity);
  vec3 bloom = blurTex(vUv, 2.5 * uDpr);
  c += bloom * bloomAmt * 0.3 * uIntensity;
  vec2 q = vUv - 0.5;
  c *= 1.0 - dot(q, q) * (0.6 * uIntensity);
  fragColor = vec4(c, 1.0);
}
`,Au=Te+`
void main(){
  float t = uTime;
  float slipAmt = mix(0.05, 0.35, uParams.x);
  float splitAmt = mix(4.0, 40.0, uParams.y);
  float freq = mix(0.3, 0.85, uParams.z);
  float tt = floor(t * 12.0);
  float band = floor(vUv.y * 20.0);
  float a = step(1.0 - freq, hash21(vec2(band, tt)));
  float slip = (hash21(vec2(band * 3.1, tt)) - 0.5) * slipAmt * a;
  float band2 = floor(vUv.y * 90.0);
  float a2 = step(0.85, hash21(vec2(band2, tt + 5.0)));
  slip += (hash21(vec2(band2, tt)) - 0.5) * 0.05 * a2;
  vec2 uv = vUv + vec2(slip, 0.0);
  float sp = (splitAmt * (0.5 + a)) / uResolution.x;
  vec3 c;
  c.r = texture(uTex, uv + vec2(sp, 0.0)).r;
  c.g = texture(uTex, uv - vec2(sp * 0.3, 0.0)).g;
  c.b = texture(uTex, uv - vec2(sp, 0.0)).b;
  if (a > 0.5 && hash21(vec2(band, tt + 9.0)) > 0.6) { c = c.gbr; }
  fragColor = vec4(mix(texture(uTex, vUv).rgb, c, uIntensity), 1.0);
}
`,ku=Te+`
void main(){
  float t = uTime;
  float track = mix(0.01, 0.06, uParams.x);
  float chroma = mix(2.0, 12.0, uParams.y);
  float wob = (fbm(vec2(vUv.y * 40.0, t * 1.5)) - 0.5) * track;
  float bandShift = 0.0;
  float bandBright = 0.0;
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    float by = fract(hash21(vec2(fi, 3.0)) + t * (0.02 + 0.025 * fi));
    float bh = mix(0.006, 0.05, hash21(vec2(fi, 7.0)));
    float b = smoothstep(bh, 0.0, abs(vUv.y - by));
    bandShift += b * (hash21(vec2(fi, 11.0)) - 0.5) * 0.05;
    bandBright += b;
  }
  vec2 uv = vUv + vec2(wob + bandShift, 0.0);
  float sp = chroma / uResolution.x;
  vec3 c;
  c.r = texture(uTex, uv + vec2(sp * 1.5, 0.0)).r;
  c.g = texture(uTex, uv).g;
  c.b = texture(uTex, uv - vec2(sp, 0.0)).b;
  float scan = 0.5 + 0.5 * sin(vUv.y * uResolution.y / 2.2 * 6.28318 - t * 8.0);
  c *= mix(1.0, 0.84 + 0.16 * scan, 0.5);
  c += clamp(bandBright, 0.0, 1.0) * 0.12;
  fragColor = vec4(mix(texture(uTex, vUv).rgb, c, uIntensity), 1.0);
}
`,Du=Te+`
void main(){
  float t = uTime;
  float glowAmt = uParams.x;
  float scanAmt = uParams.y;
  float bright = mix(0.7, 1.4, uParams.z);
  float cell = mix(2.0, 16.0, uParams.w) * uDpr;
  vec2 cells = uResolution / cell;
  vec3 src = texture(uTex, (floor(vUv * cells) + 0.5) / cells).rgb;
  float l = luma(src);
  float lit = 1.0 - l;
  vec3 amber = uColorA * lit;
  float bl = 0.0;
  vec2 o = 3.0 / uResolution;
  for (int i = -3; i <= 3; i++){ bl += (1.0 - luma(texture(uTex, vUv + vec2(float(i) * o.x, 0.0)).rgb)); }
  amber += uColorA * (bl / 7.0) * glowAmt;
  float scan = 0.5 + 0.5 * sin(vUv.y * uResolution.y / 1.8 * 6.28318 - t * 4.0);
  vec3 screen = uColorB + amber * bright * mix(1.0 - scanAmt * 0.5, 1.0, scan);
  fragColor = vec4(mix(src, screen, uIntensity), 1.0);
}
`,Fu=Te+`
void main(){
  float cell = mix(6.0, 48.0, uParams.x) * uDpr;
  float glossAmt = uParams.y;
  float sat = mix(1.0, 2.0, uParams.z);
  vec2 cells = uResolution / cell;
  vec2 gp = vUv * cells;
  vec2 center = (floor(gp) + 0.5) / cells;
  vec3 c = texture(uTex, center).rgb;
  float l = luma(c);
  c = mix(vec3(l), c, sat);
  vec2 f = fract(gp) - 0.5;
  float dist = length(f);
  float rc = smoothstep(0.5, 0.4, dist);
  float gloss = smoothstep(0.32, 0.0, length(f - vec2(-0.15, -0.18)));
  float rim = smoothstep(0.5, 0.46, dist) - smoothstep(0.46, 0.4, dist);
  float present = smoothstep(0.05, 0.3, 1.0 - l);
  vec3 outc = mix(vec3(0.97), c, rc * present);
  outc += gloss * glossAmt * 0.7 * present;
  outc += rim * 0.2 * present;
  fragColor = vec4(mix(texture(uTex, vUv).rgb, outc, uIntensity), 1.0);
}
`,Lu=Te+`
void main(){ fragColor = vec4(texture(uTex, vUv).rgb, 1.0); }
`,Uu={abstract:Su,charcoal:yu,pencil:Mu,brush:wu,halftone:Pu,risograph:Cu,stainedGlass:Tu,paperCutout:Ru,crt:Eu,glitch:Au,vhs:ku,amber:Du,gummy:Fu};function Bu(e,t){let a=new Map;function r(n){let o=a.get(n);if(o)return o;let l=V(e,Q,Uu[n]??Lu),i={program:l,uTex:e.getUniformLocation(l,"uTex"),uStripes:e.getUniformLocation(l,"uStripes"),uTime:e.getUniformLocation(l,"uTime"),uIntensity:e.getUniformLocation(l,"uIntensity"),uResolution:e.getUniformLocation(l,"uResolution"),uDpr:e.getUniformLocation(l,"uDpr"),uParams:e.getUniformLocation(l,"uParams"),uColorA:e.getUniformLocation(l,"uColorA"),uColorB:e.getUniformLocation(l,"uColorB")};return a.set(n,i),i}return{render(n,o,l,i,s=0,u=0){let f=r(i.mode);X(e,n),n||(e.viewport(s,u,i.resolution[0],i.resolution[1]),i.resolution[0],i.resolution[1],void 0),e.useProgram(f.program),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,o),e.uniform1i(f.uTex,0),e.activeTexture(e.TEXTURE1),e.bindTexture(e.TEXTURE_2D,l),e.uniform1i(f.uStripes,1),e.uniform1f(f.uTime,i.time),e.uniform1f(f.uIntensity,i.intensity),e.uniform2f(f.uResolution,i.resolution[0],i.resolution[1]),e.uniform1f(f.uDpr,i.dpr),e.uniform4f(f.uParams,i.params[0],i.params[1],i.params[2],i.params[3]),e.uniform3f(f.uColorA,...Ce(i.colorA)),e.uniform3f(f.uColorB,...Ce(i.colorB)),t.draw()},dispose(){for(let n of a.values())e.deleteProgram(n.program);a.clear()}}}var Iu=`#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uResolution;
uniform vec3 uBg;
out vec4 fragColor;
void main(){
  vec3 here = texture(uTex, vUv).rgb;
  if (distance(here, uBg) > 0.12) { fragColor = vec4(here, 1.0); return; }
  float st = 1.5 / uResolution.x;
  vec3 leftCol = uBg; float leftDist = 999.0;
  vec3 rightCol = uBg; float rightDist = 999.0;
  for (int i = 1; i <= 14; i++) {
    if (leftDist > 900.0) {
      vec3 s = texture(uTex, vUv - vec2(float(i) * st, 0.0)).rgb;
      if (distance(s, uBg) > 0.12) { leftCol = s; leftDist = float(i); }
    }
    if (rightDist > 900.0) {
      vec3 s = texture(uTex, vUv + vec2(float(i) * st, 0.0)).rgb;
      if (distance(s, uBg) > 0.12) { rightCol = s; rightDist = float(i); }
    }
  }
  if (leftDist < 900.0 && rightDist < 900.0) {
    fragColor = vec4(mix(leftCol, rightCol, leftDist / (leftDist + rightDist)), 1.0);
  } else {
    fragColor = vec4(here, 1.0);
  }
}
`;function _u(e,t){let a=V(e,Q,Iu),r=e.getUniformLocation(a,"uTex"),n=e.getUniformLocation(a,"uResolution"),o=e.getUniformLocation(a,"uBg");return{render(l,i,s){X(e,l),e.useProgram(a),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,i),e.uniform1i(r,0),e.uniform2f(n,s.resolution[0],s.resolution[1]),e.uniform3f(o,...Ce(s.bg)),t.draw()},dispose(){e.deleteProgram(a)}}}var Wu=`#version 300 es
precision highp float;

in vec2 vUv;

uniform sampler2D uCell;
uniform vec2 uGridSize;
uniform float uTopBandThreshold;
uniform float uCoverage;
uniform float uTimeSec;
uniform float uCharsetLen;
uniform float uShuffleSpeed;
uniform vec2 uPosition;
uniform vec2 uArea;

out vec4 finalColor;

const float BASE_DELAY_SEC = 0.25;
const float JITTER_SEC = 0.3;
const float BURST_SEC = 0.18;
const float STEP_SEC = 0.045;
const float K1 = 137.0;
const float K2 = 61.0;

float cellHash(float col, float row, float salt) {
  float x = sin(col * 12.9898 + row * 78.233 + salt * 43.7381) * 43758.5453;
  return fract(x);
}

float letterBaseGlyph(float col, float row) {
  float h = cellHash(col, row, 2.0);
  return min(floor(h * uCharsetLen), uCharsetLen - 1.0);
}

float letterGlyphAt(float col, float row) {
  float speed = max(uShuffleSpeed, 0.05);
  float jitter = cellHash(col, row, 3.0);
  float cycleLen = (BASE_DELAY_SEC + jitter * JITTER_SEC) / speed;
  float burstDur = BURST_SEC / speed;
  float stepDur = STEP_SEC / speed;

  float cycleIndex = floor(uTimeSec / cycleLen);
  float localTime = uTimeSec - cycleIndex * cycleLen;

  if (localTime >= burstDur) {
    return letterBaseGlyph(col, row);
  }

  float stepIndex = floor(localTime / stepDur);
  float h = cellHash(col + K1 * cycleIndex + K2 * stepIndex, row + K1 * stepIndex + K2 * cycleIndex, 5.0);
  return min(floor(h * uCharsetLen), uCharsetLen - 1.0);
}

void main() {
  float cols = uGridSize.x;
  float rows = uGridSize.y;
  float col = floor(vUv.x * cols);
  float row = floor(vUv.y * rows);

  float luma = texture(uCell, vUv).r;
  vec2 cellCenter = (vec2(col, row) + 0.5) / uGridSize;
  vec2 halfArea = max(uArea * 0.5, vec2(0.0001));
  bool insideArea = all(lessThanEqual(abs(cellCenter - uPosition), halfArea));

  bool present = insideArea && (uCoverage > 0.0) && (luma >= uTopBandThreshold) && (cellHash(col, row, 1.0) < uCoverage);
  float gi = letterGlyphAt(col, row);

  finalColor = vec4((present ? (gi + 1.0) : 0.0) / 255.0, 0.0, 0.0, 1.0);
}
`;function Gu(e,t){let a=V(e,Q,Wu),r=e.getUniformLocation(a,"uCell"),n=e.getUniformLocation(a,"uGridSize"),o=e.getUniformLocation(a,"uTopBandThreshold"),l=e.getUniformLocation(a,"uCoverage"),i=e.getUniformLocation(a,"uTimeSec"),s=e.getUniformLocation(a,"uCharsetLen"),u=e.getUniformLocation(a,"uShuffleSpeed"),f=e.getUniformLocation(a,"uPosition"),c=e.getUniformLocation(a,"uArea");return{render(m,g,b){X(e,m),e.useProgram(a),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,g),e.uniform1i(r,0),e.uniform2f(n,b.cols,b.rows),e.uniform1f(o,b.topBandThreshold),e.uniform1f(l,b.coverage),e.uniform1f(i,b.timeSec),e.uniform1f(s,b.charsetLen),e.uniform1f(u,b.shuffleSpeed),e.uniform2f(f,b.positionX,b.positionY),e.uniform2f(c,b.areaWidth,b.areaHeight),t.draw()},dispose(){e.deleteProgram(a)}}}var Sa=[..."ABCDEFGHIJKLMNOPQRSTUVWXYZ",..."abcdefghijklmnopqrstuvwxyz",..."0123456789",..."!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~"],Ou=Sa.length;function zu(e={}){let t=e.fontPx??6,a=e.rasterScale??8,r=e.fontFamily??"monospace",n=t*a,o=Sa.length,l=Math.ceil(Math.sqrt(o)),i=l,s=l,u=l*n,f=l*n,c=null;if(typeof document<"u"&&typeof document.createElement=="function"){let b=document.createElement("canvas");b.width=u,b.height=f,c=b.getContext("2d")}else typeof OffscreenCanvas<"u"&&(c=new OffscreenCanvas(u,f).getContext("2d"));if(!c)return{data:new Uint8Array(u*f),width:u,height:f,gridCols:i,gridRows:s,glyphPx:n};c.clearRect(0,0,u,f),c.font=`${t*a}px ${r}`,c.fillStyle="#ffffff",c.textBaseline="top",c.textAlign="left";for(let b=0;b<o;b++){let S=b%l,v=Math.floor(b/l),M=S*n,y=v*n;c.fillText(Sa[b],M,y)}let m=c.getImageData(0,0,u,f).data,g=new Uint8Array(u*f);for(let b=0;b<g.length;b++)g[b]=m[b*4+3];return{data:g,width:u,height:f,gridCols:i,gridRows:s,glyphPx:n}}function Hu(e,t){let a=e.createTexture();if(!a)throw Error("Failed to create letter atlas texture");return e.bindTexture(e.TEXTURE_2D,a),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.texImage2D(e.TEXTURE_2D,0,e.R8,t.width,t.height,0,e.RED,e.UNSIGNED_BYTE,t.data),a}function Rt(e){let t=e>>>0;return function(){t|=0,t=t+1831565813|0;let a=Math.imul(t^t>>>15,1|t);return a=a+Math.imul(a^a>>>7,61|a)^a,((a^a>>>14)>>>0)/4294967296}}function ht(e){let t=e>>>0;return function(){t=t+1831565813>>>0;let a=Math.imul(t^t>>>15,1|t);return a=a+Math.imul(a^a>>>7,61|a)^a,((a^a>>>14)>>>0)/4294967296}}var kn=new Map(Sa.map((e,t)=>[e,t])),Vu={ç:"c",Ç:"C",ğ:"g",Ğ:"G",ı:"i",İ:"I",ö:"o",Ö:"O",ş:"s",Ş:"S",ü:"u",Ü:"U"};function Nu(e){let t=kn.get(e);if(t!==void 0)return t;let a=Vu[e];return a?kn.get(a)??-1:-1}function Xu(e){let t=2166136261;for(let a=0;a<e.length;a++)t^=e.charCodeAt(a),t=Math.imul(t,16777619);return t>>>0}function vi(e,t,a,r,n){return[e,t,a,r,n].join("|")}function qu(e,t,a,r,n){let o=new Uint8Array(e*t*4),l=new Uint8Array(e*t),i=r.replace(/\r/g,"").split(`
`),s=i.reduce((m,g)=>Math.max(m,[...g].length),0),u=[],f=0,c=0;if(i.forEach((m,g)=>{let b=0;for(let S of m){let v=S===" "?-1:Nu(S),M=a==="horizontal"?b:g,y=a==="horizontal"?g:s-1-b;f=Math.max(f,M+1),c=Math.max(c,y+1),v>=0&&u.push({col:M,row:y,glyphIndex:v}),b++}m.length===0&&(f=Math.max(f,a==="horizontal"?0:g+1),c=Math.max(c,a==="horizontal"?g+1:0))}),u.length>0&&f>0&&c>0&&f<=e&&c<=t){let m=[];for(let S=0;S<=t-c;S++)for(let v=0;v<=e-f;v++)m.push({col:v,row:S});let g=ht(Xu(vi(e,t,a,n,r)));for(let S=m.length-1;S>0;S--){let v=Math.floor(g()*(S+1)),M=m[S];m[S]=m[v],m[v]=M}let b=0;for(let S of m){if(b>=n)break;let v=!0;for(let M of u)if(l[(S.row+M.row)*e+S.col+M.col]){v=!1;break}if(v){for(let M of u){let y=S.col+M.col,x=(S.row+M.row)*e+y,T=x*4;o[T]=M.glyphIndex+1,o[T+3]=255,l[x]=1}b++}}}return o}function xi(e,t,a,r,n){e.bindTexture(e.TEXTURE_2D,t),e.texImage2D(e.TEXTURE_2D,0,e.RGBA8,r,n,0,e.RGBA,e.UNSIGNED_BYTE,a)}function Ve(e,t,a,r){let n=e.createTexture();if(!n)throw Error("Failed to create data texture");return e.bindTexture(e.TEXTURE_2D,n),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),xi(e,n,t,a,r),n}function wt(e,t,a,r,n){xi(e,t,a,r,n)}function ju(e){let t=null,a=[1,1],r="",n=null,o=null,l="";return{get atlasTex(){return t},get atlasGrid(){return a},get dummyTex(){return n},ensureAtlas(i){if(!t||r!==i){t&&e.deleteTexture(t);let s=zu({fontFamily:i});t=Hu(e,s),a=[s.gridCols,s.gridRows],r=i}n||=Ve(e,new Uint8Array(4),1,1)},ensureTextMap(i,s,u,f,c){let m=vi(i,s,u,c,f);if(o&&l===m)return o;let g=qu(i,s,u,f,c);return o?wt(e,o,g,i,s):o=Ve(e,g,i,s),l=m,o},reset(i){e=i,t=null,r="",n=null,o=null,l=""},dispose(){t&&=(e.deleteTexture(t),null),n&&=(e.deleteTexture(n),null),o&&=(e.deleteTexture(o),null)}}}var $u=`#version 300 es
precision highp float;
in vec4 aRect;
in float aOpacity;
in float aRot;
uniform vec2 uCanvas;
uniform float uVertical;
out float vCross;
out float vOpacity;
void main() {
  vec2 corner = vec2(float(gl_VertexID == 1 || gl_VertexID == 4 || gl_VertexID == 5), float(gl_VertexID == 2 || gl_VertexID == 3 || gl_VertexID == 5));
  vec2 halfSize = aRect.zw * 0.5;
  vec2 local = (corner - 0.5) * aRect.zw;
  float cs = cos(aRot);
  float sn = sin(aRot);
  vec2 rotated = vec2(local.x * cs - local.y * sn, local.x * sn + local.y * cs);
  vec2 worldPx = aRect.xy + halfSize + rotated;
  vec2 uv = worldPx / uCanvas;
  gl_Position = vec4(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0, 0.0, 1.0);
  vCross = (uVertical > 0.5) ? corner.x : corner.y;
  vOpacity = aOpacity;
}
`,Yu=`#version 300 es
precision highp float;
in vec4 aRect;
in float aOpacity;
in float aRot;
in vec3 aColor;
uniform vec2 uCanvas;
uniform float uVertical;
out float vCross;
out float vOpacity;
out vec3 vColor;
void main() {
  vec2 corner = vec2(float(gl_VertexID == 1 || gl_VertexID == 4 || gl_VertexID == 5), float(gl_VertexID == 2 || gl_VertexID == 3 || gl_VertexID == 5));
  vec2 halfSize = aRect.zw * 0.5;
  vec2 local = (corner - 0.5) * aRect.zw;
  float cs = cos(aRot);
  float sn = sin(aRot);
  vec2 rotated = vec2(local.x * cs - local.y * sn, local.x * sn + local.y * cs);
  vec2 worldPx = aRect.xy + halfSize + rotated;
  vec2 uv = worldPx / uCanvas;
  gl_Position = vec4(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0, 0.0, 1.0);
  vCross = (uVertical > 0.5) ? corner.x : corner.y;
  vOpacity = aOpacity;
  vColor = aColor;
}
`,Ku=`#version 300 es
precision highp float;
in float vCross;
in float vOpacity;
uniform float uInner;
uniform float uOuter;
out vec4 finalColor;
void main() {
  float ramp = min(vCross / uInner, (1.0 - vCross) / (1.0 - uOuter));
  float a = vOpacity * clamp(ramp, 0.0, 1.0);
  finalColor = vec4(vec3(a), 1.0);
}
`,Ju=`#version 300 es
precision highp float;
in float vCross;
in float vOpacity;
in vec3 vColor;
uniform float uInner;
uniform float uOuter;
out vec4 finalColor;
void main() {
  float ramp = min(vCross / uInner, (1.0 - vCross) / (1.0 - uOuter));
  float a = vOpacity * clamp(ramp, 0.0, 1.0);
  finalColor = vec4(vColor * a, a);
}
`,Sr=6,Qu=Sr*4,yr=9,Zu=yr*4;function ec(e){let t=V(e,$u,Ku),a=V(e,Yu,Ju),r=e.createVertexArray(),n=e.createVertexArray(),o=e.createBuffer(),l=e.createBuffer();if(!r||!n||!o||!l)throw Error("Failed to create flames GL objects");let i=Qu;e.bindVertexArray(r),e.bindBuffer(e.ARRAY_BUFFER,o);{let T=e.getAttribLocation(t,"aRect"),R=e.getAttribLocation(t,"aOpacity");e.enableVertexAttribArray(T),e.vertexAttribPointer(T,4,e.FLOAT,!1,i,0),e.vertexAttribDivisor(T,1),e.enableVertexAttribArray(R),e.vertexAttribPointer(R,1,e.FLOAT,!1,i,16),e.vertexAttribDivisor(R,1);let C=e.getAttribLocation(t,"aRot");e.enableVertexAttribArray(C),e.vertexAttribPointer(C,1,e.FLOAT,!1,i,20),e.vertexAttribDivisor(C,1)}let s=Zu;e.bindVertexArray(n),e.bindBuffer(e.ARRAY_BUFFER,l);{let T=e.getAttribLocation(a,"aRect"),R=e.getAttribLocation(a,"aOpacity"),C=e.getAttribLocation(a,"aColor");e.enableVertexAttribArray(T),e.vertexAttribPointer(T,4,e.FLOAT,!1,s,0),e.vertexAttribDivisor(T,1),e.enableVertexAttribArray(R),e.vertexAttribPointer(R,1,e.FLOAT,!1,s,16),e.vertexAttribDivisor(R,1);let w=e.getAttribLocation(a,"aRot");e.enableVertexAttribArray(w),e.vertexAttribPointer(w,1,e.FLOAT,!1,s,20),e.vertexAttribDivisor(w,1),e.enableVertexAttribArray(C),e.vertexAttribPointer(C,3,e.FLOAT,!1,s,24),e.vertexAttribDivisor(C,1)}e.bindVertexArray(null),e.bindBuffer(e.ARRAY_BUFFER,null);let u=e.getUniformLocation(t,"uCanvas"),f=e.getUniformLocation(t,"uVertical"),c=e.getUniformLocation(t,"uInner"),m=e.getUniformLocation(t,"uOuter"),g=e.getUniformLocation(a,"uCanvas"),b=e.getUniformLocation(a,"uVertical"),S=e.getUniformLocation(a,"uInner"),v=e.getUniformLocation(a,"uOuter"),M=new Float32Array,y=new Float32Array;function x(T){let R=T.length*Sr;M.length<R&&(M=new Float32Array(R));for(let C=0;C<T.length;C++){let w=T[C],p=C*Sr;M[p]=w.x+w.driftX,M[p+1]=w.y+w.driftY,M[p+2]=w.width,M[p+3]=w.height,M[p+4]=w.opacity*w.fade,M[p+5]=w.rot}return R}return{render(T,R,C){if(R.length===0)return;let w=x(R);X(e,T),e.useProgram(t),e.uniform2f(u,C.canvasW,C.canvasH),e.uniform1f(f,+!!C.vertical),e.uniform1f(c,C.inner),e.uniform1f(m,C.outer),e.bindVertexArray(r),e.bindBuffer(e.ARRAY_BUFFER,o),e.bufferData(e.ARRAY_BUFFER,M.subarray(0,w),e.DYNAMIC_DRAW),e.bindBuffer(e.ARRAY_BUFFER,null),e.enable(e.BLEND),e.blendFunc(e.ONE,e.ONE),e.drawArraysInstanced(e.TRIANGLES,0,6,R.length),e.disable(e.BLEND),e.bindVertexArray(null)},renderColors(T,R,C,w,p){if(C.length===0)return;let E=Math.max(1,w.length),D=x(C);X(e,T),e.useProgram(t),e.uniform2f(u,p.canvasW,p.canvasH),e.uniform1f(f,+!!p.vertical),e.uniform1f(c,p.inner),e.uniform1f(m,p.outer),e.bindVertexArray(r),e.bindBuffer(e.ARRAY_BUFFER,o),e.bufferData(e.ARRAY_BUFFER,M.subarray(0,D),e.DYNAMIC_DRAW),e.bindBuffer(e.ARRAY_BUFFER,null),e.enable(e.BLEND),e.blendFunc(e.ONE,e.ONE),e.drawArraysInstanced(e.TRIANGLES,0,6,C.length),e.bindVertexArray(null);let L=C.length*yr;y.length<L&&(y=new Float32Array(L));for(let H=0;H<C.length;H++){let U=C[H],A=H*yr,ee=w[Math.min(E-1,Math.floor(U.colorSeed*E))];y[A]=U.x+U.driftX,y[A+1]=U.y+U.driftY,y[A+2]=U.width,y[A+3]=U.height,y[A+4]=U.opacity*U.fade,y[A+5]=U.rot,y[A+6]=ee.r/255,y[A+7]=ee.g/255,y[A+8]=ee.b/255}X(e,R),e.useProgram(a),e.uniform2f(g,p.canvasW,p.canvasH),e.uniform1f(b,+!!p.vertical),e.uniform1f(S,p.inner),e.uniform1f(v,p.outer),e.bindVertexArray(n),e.bindBuffer(e.ARRAY_BUFFER,l),e.bufferData(e.ARRAY_BUFFER,y.subarray(0,L),e.DYNAMIC_DRAW),e.bindBuffer(e.ARRAY_BUFFER,null),e.enable(e.BLEND),e.blendFunc(e.ONE,e.ONE_MINUS_SRC_ALPHA),e.drawArraysInstanced(e.TRIANGLES,0,6,C.length),e.blendFunc(e.ONE,e.ONE),e.disable(e.BLEND),e.bindVertexArray(null)},dispose(){e.deleteProgram(t),e.deleteProgram(a),e.deleteVertexArray(r),e.deleteVertexArray(n),e.deleteBuffer(o),e.deleteBuffer(l)}}}var tc=`#version 300 es
precision highp float;
in vec4 aRect;
in float aOpacity;
in float aTilt;
uniform vec2 uCanvas;
out vec2 vLocal;
out float vOpacity;
out float vTilt;
void main() {
  vec2 corner = vec2(float(gl_VertexID == 1 || gl_VertexID == 4 || gl_VertexID == 5), float(gl_VertexID == 2 || gl_VertexID == 3 || gl_VertexID == 5));
  vec2 worldPx = aRect.xy + corner * aRect.zw;
  vec2 uv = worldPx / uCanvas;
  gl_Position = vec4(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0, 0.0, 1.0);
  vLocal = corner;
  vOpacity = aOpacity;
  vTilt = aTilt;
}
`,ac=`#version 300 es
precision highp float;
in vec4 aRect;
in float aOpacity;
in float aTilt;
in vec3 aColor;
uniform vec2 uCanvas;
out vec2 vLocal;
out float vOpacity;
out float vTilt;
out vec3 vColor;
void main() {
  vec2 corner = vec2(float(gl_VertexID == 1 || gl_VertexID == 4 || gl_VertexID == 5), float(gl_VertexID == 2 || gl_VertexID == 3 || gl_VertexID == 5));
  vec2 worldPx = aRect.xy + corner * aRect.zw;
  vec2 uv = worldPx / uCanvas;
  gl_Position = vec4(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0, 0.0, 1.0);
  vLocal = corner;
  vOpacity = aOpacity;
  vTilt = aTilt;
  vColor = aColor;
}
`,bi=`float starShape(vec2 local) {
  vec2 p = local * 2.0 - 1.0;
  float shear = tan(clamp(vTilt, -1.35, 1.35));
  p.x -= p.y * shear;
  float dist = length(p);
  float core = smoothstep(0.24, 0.0, dist);
  float hRay = exp(-abs(p.y) * 34.0) * smoothstep(1.0, 0.0, abs(p.x));
  float vRay = exp(-abs(p.x) * 34.0) * smoothstep(1.0, 0.0, abs(p.y));
  float diamond = smoothstep(0.58, 0.0, abs(p.x) + abs(p.y));
  return clamp(max(core, max(hRay, vRay) * 0.88 + diamond * 0.42), 0.0, 1.0);
}`,rc=`#version 300 es
precision highp float;
in vec2 vLocal;
in float vOpacity;
in float vTilt;
out vec4 finalColor;

${bi}

void main() {
  float a = clamp(starShape(vLocal) * vOpacity, 0.0, 1.0);
  finalColor = vec4(vec3(a), 1.0);
}
`,nc=`#version 300 es
precision highp float;
in vec2 vLocal;
in float vOpacity;
in float vTilt;
in vec3 vColor;
out vec4 finalColor;

${bi}

void main() {
  float a = clamp(starShape(vLocal) * vOpacity, 0.0, 1.0);
  finalColor = vec4(vColor * a, a);
}
`,Dn=8,Mr=6,oc=Mr*4,wr=9,ic=wr*4;function lc(e){let t=V(e,tc,rc),a=V(e,ac,nc),r=e.createVertexArray(),n=e.createVertexArray(),o=e.createBuffer(),l=e.createBuffer();if(!r||!n||!o||!l)throw Error("Failed to create background stars GL objects");let i=oc;e.bindVertexArray(r),e.bindBuffer(e.ARRAY_BUFFER,o);{let b=e.getAttribLocation(t,"aRect"),S=e.getAttribLocation(t,"aOpacity"),v=e.getAttribLocation(t,"aTilt");e.enableVertexAttribArray(b),e.vertexAttribPointer(b,4,e.FLOAT,!1,i,0),e.vertexAttribDivisor(b,1),e.enableVertexAttribArray(S),e.vertexAttribPointer(S,1,e.FLOAT,!1,i,16),e.vertexAttribDivisor(S,1),e.enableVertexAttribArray(v),e.vertexAttribPointer(v,1,e.FLOAT,!1,i,20),e.vertexAttribDivisor(v,1)}let s=ic;e.bindVertexArray(n),e.bindBuffer(e.ARRAY_BUFFER,l);{let b=e.getAttribLocation(a,"aRect"),S=e.getAttribLocation(a,"aOpacity"),v=e.getAttribLocation(a,"aTilt"),M=e.getAttribLocation(a,"aColor");e.enableVertexAttribArray(b),e.vertexAttribPointer(b,4,e.FLOAT,!1,s,0),e.vertexAttribDivisor(b,1),e.enableVertexAttribArray(S),e.vertexAttribPointer(S,1,e.FLOAT,!1,s,16),e.vertexAttribDivisor(S,1),e.enableVertexAttribArray(v),e.vertexAttribPointer(v,1,e.FLOAT,!1,s,20),e.vertexAttribDivisor(v,1),e.enableVertexAttribArray(M),e.vertexAttribPointer(M,3,e.FLOAT,!1,s,24),e.vertexAttribDivisor(M,1)}e.bindVertexArray(null),e.bindBuffer(e.ARRAY_BUFFER,null);let u=e.getUniformLocation(t,"uCanvas"),f=e.getUniformLocation(a,"uCanvas"),c=new Float32Array,m=new Float32Array;function g(b){let S=b.length*Mr;c.length<S&&(c=new Float32Array(S));for(let v=0;v<b.length;v++){let M=b[v],y=Math.max(.001,M.sizePx*M.scale*Dn),x=v*Mr;c[x]=M.x-y*.5,c[x+1]=M.y-y*.5,c[x+2]=y,c[x+3]=y,c[x+4]=M.opacity,c[x+5]=M.tiltRad}return S}return{render(b,S,v){if(S.length===0)return;let M=g(S);X(e,b),e.useProgram(t),e.uniform2f(u,v.canvasW,v.canvasH),e.bindVertexArray(r),e.bindBuffer(e.ARRAY_BUFFER,o),e.bufferData(e.ARRAY_BUFFER,c.subarray(0,M),e.DYNAMIC_DRAW),e.bindBuffer(e.ARRAY_BUFFER,null),e.enable(e.BLEND),e.blendFunc(e.ONE,e.ONE),e.drawArraysInstanced(e.TRIANGLES,0,6,S.length),e.disable(e.BLEND),e.bindVertexArray(null)},renderColors(b,S,v,M,y){if(v.length===0)return;let x=Math.max(1,M.length),T=g(v);X(e,b),e.useProgram(t),e.uniform2f(u,y.canvasW,y.canvasH),e.bindVertexArray(r),e.bindBuffer(e.ARRAY_BUFFER,o),e.bufferData(e.ARRAY_BUFFER,c.subarray(0,T),e.DYNAMIC_DRAW),e.bindBuffer(e.ARRAY_BUFFER,null),e.enable(e.BLEND),e.blendFunc(e.ONE,e.ONE),e.drawArraysInstanced(e.TRIANGLES,0,6,v.length),e.bindVertexArray(null);let R=v.length*wr;m.length<R&&(m=new Float32Array(R));let[C,w,p]=Ce(y.color);for(let E=0;E<v.length;E++){let D=v[E],L=Math.max(.001,D.sizePx*D.scale*Dn),H=E*wr,U=M[Math.min(x-1,Math.floor(D.colorSeed*x))];m[H]=D.x-L*.5,m[H+1]=D.y-L*.5,m[H+2]=L,m[H+3]=L,m[H+4]=D.opacity,m[H+5]=D.tiltRad,m[H+6]=U?U.r/255:C,m[H+7]=U?U.g/255:w,m[H+8]=U?U.b/255:p}X(e,S),e.useProgram(a),e.uniform2f(f,y.canvasW,y.canvasH),e.bindVertexArray(n),e.bindBuffer(e.ARRAY_BUFFER,l),e.bufferData(e.ARRAY_BUFFER,m.subarray(0,R),e.DYNAMIC_DRAW),e.bindBuffer(e.ARRAY_BUFFER,null),e.enable(e.BLEND),e.blendFunc(e.ONE,e.ONE_MINUS_SRC_ALPHA),e.drawArraysInstanced(e.TRIANGLES,0,6,v.length),e.blendFunc(e.ONE,e.ONE),e.disable(e.BLEND),e.bindVertexArray(null)},dispose(){e.deleteProgram(t),e.deleteProgram(a),e.deleteVertexArray(r),e.deleteVertexArray(n),e.deleteBuffer(o),e.deleteBuffer(l)}}}function Fn(e){return{name:e.name,render:()=>{let{particles:t,opts:a}=e.step(),r=e.getFieldRT();e.colorsMode?e.pass.renderColors(r,e.getFieldColorRT(),t,e.getPalette(),a):e.pass.render(r,t,a)},dispose:()=>e.pass.dispose()}}function be(e,t,a){return e+(t-e)*a}function Mt(e,t,a){let r=Math.min(1,Math.max(0,(a-e)/(t-e)));return r*r*(3-2*r)}function lr(e){return{stars:[],lastStepMs:0,random:e}}function sc(e,t){let a=Math.min(100,Math.max(0,e.density))/100;if(!e.enabled||a<=0||e.opacity<=0||e.sizePx<=0)return 0;let r=Math.max(1,t.width*t.height/8e3);return Math.min(360,Math.max(1,Math.round((4+r*1.9)*a)))}function uc(e,t,a,r,n){let o=Math.min(1,Math.max(0,t.sizeRandomness)),l=be(1-o,1+o,e.random()),i=Math.max(.05,t.twinkleSpeed),s=be(750,2200,e.random())/i,u=n?r-e.random()*s:r;return{x:e.random()*a.width,y:e.random()*a.height,sizePx:Math.max(.25,t.sizePx*Math.max(.12,l)),scale:0,tiltRad:0,bornMs:u,lifeMs:s,phase:e.random()*Math.PI*2,colorSeed:e.random(),baseOpacity:be(.55,1,e.random()),opacity:0}}function Ln(e,t,a){let r=a-e.bornMs;if(r<0||r>=e.lifeMs)return!1;let n=r/e.lifeMs,o=Mt(0,.28,n)*(1-Mt(.62,1,n)),l=Mt(0,.18,n)*(1-Mt(.72,1,n)),i=Math.max(0,t.twinkleSpeed),s=.5+.5*Math.sin(a/1e3*i*Math.PI*2+e.phase),u=Math.min(1,Math.max(0,t.twinkleAmount)),f=be(1,.78+.22*s,u),c=be(1,.65+.35*s,u),m=Math.min(89,Math.max(-89,t.tiltAngleDeg))*Math.PI/180;return e.scale=Math.min(1,Math.max(0,o*f)),e.tiltRad=m,e.opacity=Math.min(1,Math.max(0,t.opacity*e.baseOpacity*l*c)),e.scale>.001&&e.opacity>.001||n<.96}function cc(e,t,a,r){if(!t.enabled||a.width<=0||a.height<=0){e.stars.length=0,e.lastStepMs=r;return}let n=sc(t,a);if(n<=0){e.stars.length=0,e.lastStepMs=r;return}let o=e.lastStepMs<=0;for(e.lastStepMs=r,e.stars=e.stars.filter(l=>Ln(l,t,r)),e.stars.length>n&&(e.stars.length=n);e.stars.length<n;){let l=uc(e,t,a,r,o);Ln(l,t,r),e.stars.push(l)}}var Un=1024,Pr={left:0,right:1,bottom:2,top:3},fc=["left","right","bottom","top"];function Bn(e,t){return e.x===t.x&&e.y===t.y}function dc(e){let t=[];for(let r of e){if(!Number.isFinite(r.x)||!Number.isFinite(r.y)||r.x<0||r.x>1||r.y<0||r.y>1)continue;let n={x:Object.is(r.x,-0)?0:r.x,y:Object.is(r.y,-0)?0:r.y};(!t.at(-1)||!Bn(t.at(-1),n))&&t.push(n)}if(t.length>1&&Bn(t[0],t.at(-1))&&t.pop(),new Set(t.map(r=>`${r.x},${r.y}`)).size<3)return[];let a=0;for(let r=0;r<t.length;r++){let n=t[r],o=t[(r+1)%t.length];a+=n.x*o.y-o.x*n.y}return Math.abs(a)>2**-52?t:[]}function Br(e){if(!e)return null;let t=dc(e.points);return t.length>=3?{id:e.id,points:t}:null}function Ir(e){return e.map(t=>`${t.x},${t.y}`).join(";")}function Si(e){return{cols:Math.max(1,Math.floor(Number.isFinite(e.cols)?e.cols:1)),rows:Math.max(1,Math.floor(Number.isFinite(e.rows)?e.rows:1)),cssWidth:Math.max(1,Number.isFinite(e.cssWidth)?e.cssWidth:1),cssHeight:Math.max(1,Number.isFinite(e.cssHeight)?e.cssHeight:1)}}function yi(e,t){return`${e.id}|${Ir(e.points)}|${t.cols}x${t.rows}|${t.cssWidth}x${t.cssHeight}`}function hc(e,t){return Math.abs(e)>Math.abs(t)?e>0?"right":"left":t>0?"bottom":"top"}function pc(e,t,a){let r=Math.max(1,t),n=Math.max(1,a),o=0;for(let s=0;s<e.length;s++){let u=e[s],f=e[(s+1)%e.length];o+=u.x*f.y-f.x*u.y}let l=o>=0?1:-1,i=[];for(let s=0;s<e.length;s++){let u=e[s],f=e[(s+1)%e.length],c=u.x*r,m=u.y*n,g=f.x*r,b=f.y*n,S=g-c,v=b-m,M=S*S+v*v;M<=2**-52||i.push({a:u,b:f,ax:c,ay:m,dx:S,dy:v,lengthSq:M,side:hc(v*l,-S*l)})}return{width:r,height:n,edges:i}}function mc(e,t){let a=t.x*e.width,r=t.y*e.height,n=!1,o=1/0,l="left";for(let s of e.edges){s.a.y>t.y!=s.b.y>t.y&&t.x<(s.b.x-s.a.x)*(t.y-s.a.y)/(s.b.y-s.a.y)+s.a.x&&(n=!n);let u=Math.max(0,Math.min(1,((a-s.ax)*s.dx+(r-s.ay)*s.dy)/s.lengthSq)),f=s.ax+s.dx*u,c=s.ay+s.dy*u,m=a-f,g=r-c,b=m*m+g*g;(b<o-1e-12||Math.abs(b-o)<=1e-12&&Pr[s.side]<Pr[l])&&(o=b,l=s.side)}let i=Math.round(Math.sqrt(o)*1e9)/1e9;return{inside:n||i<=1e-9,distancePx:i,side:l}}function gc(e,t){let a=Br(e);if(!a)return null;let r=Si(t),n=Math.min(Un,r.cols),o=Math.min(Un,r.rows),l=new Float32Array(n*o*4),i=pc(a.points,r.cssWidth,r.cssHeight);for(let u=0;u<o;u++){let f=1-(u+.5)/o;for(let c=0;c<n;c++){let m=mc(i,{x:(c+.5)/n,y:f}),g=(u*n+c)*4;l[g]=+!!m.inside,l[g+1]=m.distancePx,l[g+2]=Pr[m.side],l[g+3]=1}}let s=Ir(a.points);return{id:a.id,pointSignature:s,signature:yi(a,r),cols:r.cols,rows:r.rows,width:n,height:o,cssWidth:r.cssWidth,cssHeight:r.cssHeight,data:l}}function vc(e,t,a){let r=Math.max(0,Math.min(e.width-1,Math.floor(t*e.width))),n=(Math.max(0,Math.min(e.height-1,Math.floor(a*e.height)))*e.width+r)*4;return{inside:e.data[n]>=.5,distancePx:e.data[n+1],side:fc[Math.max(0,Math.min(3,Math.round(e.data[n+2])))]}}function xc(e,t,a){if(!e.inside)return 0;if(!t.enabled||!t.sides[e.side])return 1;let r=Math.fround(t.start),n=Math.fround(Math.max(t.end,r+1e-4)),o=Math.fround(Math.fround(e.distancePx)/Math.fround(Math.max(1,a))),l=Math.fround(o-r),i=Math.fround(n-r),s=Math.fround(Math.min(1,Math.max(0,Math.fround(l/i))));return Math.fround(s**Math.fround(t.power))}function bc(e,t){let a=new Map;return{get(r,n){let o=Br(r);if(!o)return null;let l=Si(n),i=yi(o,l),s=a.get(o.id);if(s?.field.signature===i)return s;let u=gc(o,l),f=e(u);s&&t(s.resource);let c={field:u,resource:f};return a.set(o.id,c),c},peek(r){return a.get(r)??null},release(r){let n=a.get(r);n&&(t(n.resource),a.delete(r))},clear(){for(let r of a.values())t(r.resource);a.clear()},abandon(){a.clear()}}}function In(e){return bc(t=>{let a=e.createTexture();if(!a)throw Error("Failed to create contour field texture");try{return e.bindTexture(e.TEXTURE_2D,a),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.texImage2D(e.TEXTURE_2D,0,e.RGBA32F,t.width,t.height,0,e.RGBA,e.FLOAT,t.data),e.bindTexture(e.TEXTURE_2D,null),a}catch(r){throw e.deleteTexture(a),r}},t=>e.deleteTexture(t))}var Sc=`#version 300 es
precision highp float;
in vec2 aCenterCell;
in float aBrightenRadiusCell;
in vec2 aPushCenterCell;
in float aPushRadiusCell;
in float aAlpha;
in float aProgress;
in float aSeed;
uniform vec2 uGridSize;
out vec2 vCenterCell;
out float vBrightenRadiusCell;
out vec2 vPushCenterCell;
out float vPushRadiusCell;
out float vAlpha;
out float vProgress;
out float vSeed;
void main() {
  vec2 corner = vec2(
    float(gl_VertexID == 1 || gl_VertexID == 4 || gl_VertexID == 5),
    float(gl_VertexID == 2 || gl_VertexID == 3 || gl_VertexID == 5)
  );
  float reachCell = max(aBrightenRadiusCell, aPushRadiusCell) + 1.0;
  vec2 quadOriginCell = aCenterCell - reachCell;
  vec2 quadSizeCell = vec2(reachCell * 2.0);
  vec2 cell = quadOriginCell + corner * quadSizeCell;
  vec2 uv = cell / uGridSize;
  gl_Position = vec4(uv.x * 2.0 - 1.0, uv.y * 2.0 - 1.0, 0.0, 1.0);
  vCenterCell = aCenterCell;
  vBrightenRadiusCell = aBrightenRadiusCell;
  vPushCenterCell = aPushCenterCell;
  vPushRadiusCell = aPushRadiusCell;
  vAlpha = aAlpha;
  vProgress = aProgress;
  vSeed = aSeed;
}
`,yc=`#version 300 es
precision highp float;
in vec2 vCenterCell;
in float vBrightenRadiusCell;
in vec2 vPushCenterCell;
in float vPushRadiusCell;
in float vAlpha;
in float vProgress;
in float vSeed;
uniform vec2 uGridSize;
uniform float uPushScale;
out vec4 finalColor;

float falloff(float distance, float radius) {
  if (radius <= 0.0 || distance >= radius) {
    return 0.0;
  }
  float t = 1.0 - distance / radius;
  return t * t * (3.0 - 2.0 * t);
}

float clickSeededUnit(float seed, float salt) {
  float x = sin(seed * 12.9898 + salt * 78.233) * 43758.5453;
  return x - floor(x);
}

float clickDissolveProgress(float waveProgress) {
  float t = clamp((waveProgress - 0.4) / 0.6, 0.0, 1.0);
  return t * t * (3.0 - 2.0 * t);
}

bool clickCellDissolved(float seed, float cellIdx, float dissolve) {
  return dissolve > 0.0 && clickSeededUnit(seed, cellIdx * 7.13 + 3.7) < dissolve;
}

void main() {
  vec2 cell = floor(gl_FragCoord.xy);
  float cellIdx = cell.y * uGridSize.x + cell.x;

  float dissolve = clickDissolveProgress(vProgress);
  if (clickCellDissolved(vSeed, cellIdx, dissolve)) {
    discard;
  }

  float distC = length(cell - vCenterCell);
  float brighten = vAlpha * falloff(distC, vBrightenRadiusCell);

  vec2 toCell = cell - vPushCenterCell;
  float distP = length(toCell);
  float pushX = 0.0;
  float pushY = 0.0;
  if (distP > 0.0 && distP < vPushRadiusCell) {
    float force = uPushScale * vAlpha * falloff(distP, vPushRadiusCell);
    vec2 dir = toCell / distP;
    pushX = force * dir.x;
    pushY = force * dir.y;
  }

  if (brighten <= 0.0 && pushX == 0.0 && pushY == 0.0) {
    discard;
  }

  finalColor = vec4(brighten, pushX, pushY, 0.0);
}
`,ma=9,ut=ma*4;function Mc(e){return Math.max(0,Math.min(1,e))}function wc(e){let t=V(e,Sc,yc),a=e.createVertexArray();if(!a)throw Error("Failed to create VAO");let r=e.createBuffer();if(!r)throw Error("Failed to create instance buffer");let n=e.getAttribLocation(t,"aCenterCell"),o=e.getAttribLocation(t,"aBrightenRadiusCell"),l=e.getAttribLocation(t,"aPushCenterCell"),i=e.getAttribLocation(t,"aPushRadiusCell"),s=e.getAttribLocation(t,"aAlpha"),u=e.getAttribLocation(t,"aProgress"),f=e.getAttribLocation(t,"aSeed"),c=e.getUniformLocation(t,"uGridSize"),m=e.getUniformLocation(t,"uPushScale");e.bindVertexArray(a),e.bindBuffer(e.ARRAY_BUFFER,r),e.enableVertexAttribArray(n),e.vertexAttribPointer(n,2,e.FLOAT,!1,ut,0),e.vertexAttribDivisor(n,1),e.enableVertexAttribArray(o),e.vertexAttribPointer(o,1,e.FLOAT,!1,ut,8),e.vertexAttribDivisor(o,1),e.enableVertexAttribArray(l),e.vertexAttribPointer(l,2,e.FLOAT,!1,ut,12),e.vertexAttribDivisor(l,1),e.enableVertexAttribArray(i),e.vertexAttribPointer(i,1,e.FLOAT,!1,ut,20),e.vertexAttribDivisor(i,1),e.enableVertexAttribArray(s),e.vertexAttribPointer(s,1,e.FLOAT,!1,ut,24),e.vertexAttribDivisor(s,1),e.enableVertexAttribArray(u),e.vertexAttribPointer(u,1,e.FLOAT,!1,ut,28),e.vertexAttribDivisor(u,1),e.enableVertexAttribArray(f),e.vertexAttribPointer(f,1,e.FLOAT,!1,ut,32),e.vertexAttribDivisor(f,1),e.bindVertexArray(null),e.bindBuffer(e.ARRAY_BUFFER,null);let g=new Float32Array;return{render(b,S,v){if(X(e,b),e.clearColor(0,0,0,0),e.clear(e.COLOR_BUFFER_BIT),S.length===0)return;let M=v.displayWidth>0?v.cols/v.displayWidth:1,y=v.displayHeight>0?v.rows/v.displayHeight:1,x=v.displayWidth>0?v.cols/v.displayWidth:1,T=S.length*ma;g.length<T&&(g=new Float32Array(T));let R=0;for(let C=0;C<S.length;C++){let w=S[C],p=Mc(w.alpha);if(p<=0)continue;let E=Math.max(1,w.radius*x),D=Math.max(1,w.radius*v.pushRadiusScale*x),L=R*ma;g[L]=w.x*M,g[L+1]=w.y*y,g[L+2]=E,g[L+3]=w.pushX*M,g[L+4]=w.pushY*y,g[L+5]=D,g[L+6]=p,g[L+7]=w.progress,g[L+8]=w.seed,R++}e.useProgram(t),e.uniform2f(c,v.cols,v.rows),e.uniform1f(m,v.pushScale),e.bindVertexArray(a),e.bindBuffer(e.ARRAY_BUFFER,r),e.bufferData(e.ARRAY_BUFFER,g.subarray(0,R*ma),e.DYNAMIC_DRAW),e.bindBuffer(e.ARRAY_BUFFER,null),e.enable(e.BLEND),e.blendFunc(e.ONE,e.ONE),e.drawArraysInstanced(e.TRIANGLES,0,6,R),e.disable(e.BLEND),e.bindVertexArray(null)},dispose(){e.deleteProgram(t),e.deleteVertexArray(a),e.deleteBuffer(r)}}}var Pc=`#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uField;
uniform sampler2D uAccum;
uniform sampler2D uTear;
uniform vec2 uPixelSize;
uniform vec2 uCellSize;
uniform vec2 uGridSize;
uniform float uPushCap;
out vec4 finalColor;

${Ta}

void main() {
  vec2 pixelCoord = vec2(vUv.x, 1.0 - vUv.y) * uPixelSize;
  float colIndex = floor(pixelCoord.x / max(uCellSize.x, 1.0));
  float rowIndex = floor(pixelCoord.y / max(uCellSize.y, 1.0));
  vec2 cuv = vec2((colIndex + 0.5) / max(uGridSize.x, 1.0), (rowIndex + 0.5) / max(uGridSize.y, 1.0));

  vec4 accum = texture(uAccum, cuv);
  float brighten = accum.r;
  vec2 pushCells = capPush(accum.gb, uPushCap);
  float tear = texture(uTear, cuv).r;

  vec2 offsetUv = pushCells * uCellSize / uPixelSize;
  offsetUv.y = -offsetUv.y;
  float field = texture(uField, vUv - offsetUv).r;
  finalColor = vec4(vec3(cursorCoverage(field, tear, brighten)), 1.0);
}
`,Cc=`#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uFieldColor;
uniform sampler2D uAccum;
uniform sampler2D uTear;
uniform vec2 uPixelSize;
uniform vec2 uCellSize;
uniform vec2 uGridSize;
uniform float uPushCap;
uniform vec3 uTrailColor;
out vec4 finalColor;

${Ta}

void main() {
  vec2 pixelCoord = vec2(vUv.x, 1.0 - vUv.y) * uPixelSize;
  float colIndex = floor(pixelCoord.x / max(uCellSize.x, 1.0));
  float rowIndex = floor(pixelCoord.y / max(uCellSize.y, 1.0));
  vec2 cuv = vec2((colIndex + 0.5) / max(uGridSize.x, 1.0), (rowIndex + 0.5) / max(uGridSize.y, 1.0));

  vec4 accum = texture(uAccum, cuv);
  float brighten = clamp(accum.r, 0.0, 1.0);
  vec2 pushCells = capPush(accum.gb, uPushCap);
  float tear = texture(uTear, cuv).r;

  vec2 offsetUv = pushCells * uCellSize / uPixelSize;
  offsetUv.y = -offsetUv.y;
  vec4 c = texture(uFieldColor, vUv - offsetUv);
  float cov = cursorCoverage(c.a, tear, brighten);
  vec3 rgb = mix(c.rgb, uTrailColor, brighten);
  finalColor = vec4(rgb, clamp(cov, 0.0, 1.0));
}
`;function Tc(e,t){let a=V(e,Q,Pc),r=e.getUniformLocation(a,"uField"),n=e.getUniformLocation(a,"uAccum"),o=e.getUniformLocation(a,"uTear"),l=e.getUniformLocation(a,"uPixelSize"),i=e.getUniformLocation(a,"uCellSize"),s=e.getUniformLocation(a,"uGridSize"),u=e.getUniformLocation(a,"uPushCap"),f=V(e,Q,Cc),c=e.getUniformLocation(f,"uFieldColor"),m=e.getUniformLocation(f,"uAccum"),g=e.getUniformLocation(f,"uTear"),b=e.getUniformLocation(f,"uPixelSize"),S=e.getUniformLocation(f,"uCellSize"),v=e.getUniformLocation(f,"uGridSize"),M=e.getUniformLocation(f,"uPushCap"),y=e.getUniformLocation(f,"uTrailColor");function x(T,R,C,w,p,E,D,L){X(e,C),e.useProgram(T),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,w),e.uniform1i(R.field,0),e.activeTexture(e.TEXTURE1),e.bindTexture(e.TEXTURE_2D,p),e.uniform1i(R.accum,1),e.activeTexture(e.TEXTURE2),e.bindTexture(e.TEXTURE_2D,E),e.uniform1i(R.tear,2),e.uniform2f(R.pixelSize,D.pixelW,D.pixelH),e.uniform2f(R.cellSize,D.cellW,D.cellH),e.uniform2f(R.gridSize,D.cols,D.rows),e.uniform1f(R.pushCap,D.pushCap),L&&R.trailColor&&e.uniform3f(R.trailColor,L[0],L[1],L[2]),t.draw(),e.activeTexture(e.TEXTURE0)}return{render(T,R,C,w,p){x(a,{field:r,accum:n,tear:o,pixelSize:l,cellSize:i,gridSize:s,pushCap:u},T,R,C,w,p)},renderColor(T,R,C,w,p,E){x(f,{field:c,accum:m,tear:g,pixelSize:b,cellSize:S,gridSize:v,pushCap:M,trailColor:y},T,R,C,w,p,E)},dispose(){e.deleteProgram(a),e.deleteProgram(f)}}}var Rc=1861,Ec=3,Ac=620,kc=62,Dc=.28,Fc=70,Lc=260,Uc=380,_n=.5,Mi=.8,Bc=1500,Ic=2200,_c=.62,Wc=.18,Wn=128,Gc=5,Oc=.22;function Gn(e){let t=Math.max(4,Math.round(e.maxLinks));return{maxStars:Math.max(4,Math.round(e.maxStars)),maxLinks:t,maxPulses:Math.min(24,Math.max(4,Math.round(t*.42)))}}function zc(e){return{caps:e,starCount:0,starBytes:new Uint8Array(e.maxStars*4),starsX:new Float32Array(e.maxStars),starsY:new Float32Array(e.maxStars),starsDirty:!0,starFxBytes:new Uint8Array(e.maxStars*4),graph:null,cssW:0,cssH:0,linkRadius:0,pairDist:0,builtPairDist:0,smoothX:0,smoothY:0,hasSmooth:!1,cursorFade:0,lastNow:-1,lastFlashGlobal:-1e9,pulses:[],pending:[],flareStart:new Float32Array(e.maxStars).fill(-1e9),starAct:new Float32Array(e.maxStars),starFlare:new Float32Array(e.maxStars),starPeak:new Float32Array(e.maxStars),starSum:new Float32Array(e.maxStars),segData:new Float32Array(e.maxLinks*4),fxData:new Float32Array(e.maxLinks*2),pulseSegData:new Float32Array(e.maxPulses*4),pulseFxData:new Float32Array(e.maxPulses*2),lineCount:0,pulseCount:0}}function ya(e){let t=Math.min(1,Math.max(0,e));return t*t*(3-2*t)}function qt(e){if(e<=0)return 0;if(e>=1)return 1;let t=e;for(let r=0;r<5;r++){let n=1-t,o=1.8*t*n*n+t*t*t,l=1.8*n*(1-3*t)+3*t*t;if(l<1e-4)break;t-=(o-e)/l,t<0&&(t=0),t>1&&(t=1)}let a=1-t;return 1.8*t*a*a+3*t*t*a+t*t*t}function Hc(e,t){let a=Math.round(44*e.starDensity);return Math.min(t.maxStars,Math.max(3,a))}function Vc(e,t){let a=Rt(Rc);e.starBytes.fill(0);for(let r=0;r<t;r++){let n=.5,o=.5,l=-1;for(let u=0;u<40;u++){let f=.055+a()*.89,c=.085+a()*.83,m=1/0;for(let g=0;g<r;g++){let b=Math.hypot((f-e.starsX[g])*1.6,c-e.starsY[g]);b<m&&(m=b)}if(m>l&&(l=m,n=f,o=c),m>=.115)break}let i=Math.round(n*255),s=Math.round(o*255);e.starsX[r]=i/255,e.starsY[r]=s/255,e.starBytes[r*4]=i,e.starBytes[r*4+1]=s,e.starBytes[r*4+2]=Math.round(a()*255),e.starBytes[r*4+3]=Math.round(a()*255)}e.starCount=t,e.starsDirty=!0,e.flareStart.fill(-1e9),e.starAct.fill(0),e.starFlare.fill(0)}function Nc(e,t,a,r){let n=e.starCount,o=new Float32Array(n),l=new Float32Array(n);for(let C=0;C<n;C++)o[C]=e.starsX[C]*t,l[C]=e.starsY[C]*a;let i=new Set;for(let C=0;C<n;C++){let w=[];for(let E=0;E<n;E++){if(E===C)continue;let D=Math.hypot(o[E]-o[C],l[E]-l[C]);D<r&&w.push({j:E,d:D})}w.sort((E,D)=>E.d-D.d);let p=Math.min(Ec,w.length);for(let E=0;E<p;E++){let D=w[E].j;i.add(C<D?C*1024+D:D*1024+C)}}let s=Array.from({length:n},()=>new Set);for(let C of i){let w=Math.floor(C/1024),p=C%1024;s[w].add(p),s[p].add(w)}let u=[];for(let C=0;C<n;C++)for(let w=C+1;w<n;w++){if(s[C].has(w))continue;let p=Math.hypot(o[w]-o[C],l[w]-l[C]);if(p>=r)continue;let E=!1;for(let D of s[C])if(s[w].has(D)){E=!0;break}E&&u.push({key:C*1024+w,d:p})}u.sort((C,w)=>C.d-w.d);let f=Math.ceil(i.size*Oc);for(let C=0;C<Math.min(f,u.length);C++)i.add(u[C].key);let c=[...i].sort((C,w)=>C-w).map(C=>({a:Math.floor(C/1024),b:C%1024,stagger:(C*2654435761>>>0)/4294967296*90,phase:0,prevPhase:0,env:0,activeSince:-1,holdUntil:0,flashStart:-1e9,lastPulse:-1e9})),m=new Map,g=Array.from({length:n},()=>[]);c.forEach((C,w)=>{m.set(C.a*1024+C.b,w),g[C.a].push(w),g[C.b].push(w)});let b=Array.from({length:n},()=>new Set);for(let C of c)b[C.a].add(C.b),b[C.b].add(C.a);let S=(C,w)=>m.get(C<w?C*1024+w:w*1024+C),v=[],M=new Set,y=C=>{let w=[];for(let E=0;E<C.length;E++){let D=S(C[E],C[(E+1)%C.length]);if(D===void 0)return;w.push(D)}let p=[...w].sort((E,D)=>E-D).join(",");M.has(p)||(M.add(p),v.push({edges:w,lastFlash:-1e9,complete:!1}))},x=[],T=new Uint8Array(n),R=(C,w)=>{for(let p of b[w]){if(v.length>=Wn)return;if(p===C){x.length>=3&&y([...x]);continue}p<C||T[p]||x.length>=Gc||(x.push(p),T[p]=1,R(C,p),x.pop(),T[p]=0)}};for(let C=0;C<n&&(x.length=0,x.push(C),T[C]=1,R(C,C),T[C]=0,!(v.length>=Wn));C++);return{sx:o,sy:l,edges:c,incident:g,polygons:v}}function Xc(e,t){return Math.hypot(e.sx[t.b]-e.sx[t.a],e.sy[t.b]-e.sy[t.a])}function On(e,t,a,r,n,o,l){if(e.pulses.length>=e.caps.maxPulses)return;let i=a.edges[r];if(o-i.lastPulse<t.pulseCooldownMs*Mi)return;i.lastPulse=o;let s=Xc(a,i)/Math.max(1,e.pairDist),u=t.pulseDurationMs*(.571+.429*Math.min(1,Math.max(0,s)));e.pulses.push({edge:r,from:n,start:o,duration:u,hops:l})}function qc(e,t,a,r,n,o,l){if(l>t.pulseRelayHops)return;let i=t.pulseCooldownMs*Mi;a.incident[r].filter(s=>s!==n).filter(s=>a.edges[s].phase>=.42&&o-a.edges[s].lastPulse>i).sort((s,u)=>a.edges[u].phase-a.edges[s].phase).slice(0,2).forEach((s,u)=>{e.pending.push({edge:s,from:r,at:o+70+u*55,hops:l})})}function zn(e,t,a){let r=Math.max(1,t.flareMs);for(let n=0;n<e.starCount;n++){let o=(a-e.flareStart[n])/r;e.starFlare[n]=o>=0&&o<1?o<.14?ya(o/.14):1-qt((o-.14)/.86):0}}function jc(e,t,a,r){a.edges.forEach((n,o)=>{n.phase<_n||n.prevPhase>=_n||r-n.lastPulse<t.pulseCooldownMs||On(e,t,a,o,Math.hypot(a.sx[n.a]-e.smoothX,a.sy[n.a]-e.smoothY)<=Math.hypot(a.sx[n.b]-e.smoothX,a.sy[n.b]-e.smoothY)?n.a:n.b,r,1)});for(let n=e.pending.length-1;n>=0;n--){let o=e.pending[n];r<o.at||(e.pending.splice(n,1),a.edges[o.edge].phase>=.3&&On(e,t,a,o.edge,o.from,r,o.hops))}for(let n=e.pulses.length-1;n>=0;n--){let o=e.pulses[n],l=a.edges[o.edge];if((r-o.start)/o.duration>=1){e.pulses.splice(n,1);let i=o.from===l.a?l.b:l.a;l.phase>=.2&&(e.flareStart[i]=r,qc(e,t,a,i,o.edge,r,o.hops+1));continue}l.phase<=.05&&e.pulses.splice(n,1)}}function $c(e,t,a){let r=0;for(let n of e.pulses){if(r>=e.caps.maxPulses)break;let o=t.edges[n.edge],l=Math.min(1,Math.max(0,(a-n.start)/n.duration)),i=n.from===o.a?l:1-l,s=ya(l/.12)*(1-qt(Math.max(0,(l-.82)/.18)))*Math.min(1,o.phase*1.4)*(n.hops>1?.82:1);if(s<.01)continue;let u=r*4,f=r*2;e.pulseSegData[u]=e.starsX[o.a],e.pulseSegData[u+1]=e.starsY[o.a],e.pulseSegData[u+2]=e.starsX[o.b],e.pulseSegData[u+3]=e.starsY[o.b],e.pulseFxData[f]=i,e.pulseFxData[f+1]=s,r++}e.pulseCount=r}function Hn(e,t){let a=1-Math.exp(-t/kc);for(let r=0;r<e.starCount;r++){let n=e.starPeak[r],o=Math.min(1,Math.max(0,(e.starSum[r]-n)*.5)),l=Math.min(1,n*(1+Dc*o));e.starAct[r]+=(l-e.starAct[r])*a}}function Vn(e){for(let t=0;t<e.caps.maxStars;t++){let a=t<e.starCount?e.starAct[t]:0,r=t<e.starCount?e.starFlare[t]:0;e.starFxBytes[t*4]=Math.round(Math.min(1,Math.max(0,a))*255),e.starFxBytes[t*4+1]=Math.round(Math.min(1,Math.max(0,r))*255)}}function Yc(e,t,a,r,n,o){let l=e.lastNow<0?16:Math.min(50,Math.max(0,o-e.lastNow));e.lastNow=o;let i=Hc(t,e.caps);i!==e.starCount&&(Vc(e,i),e.graph=null);let s=Math.min(r,n);e.linkRadius=t.radiusScale*s,e.pairDist=t.linkMaxDistScale*s;let u=Math.abs(r-e.cssW)>.5||Math.abs(n-e.cssH)>.5,f=Math.abs(e.pairDist-e.builtPairDist)>.5;r>1&&(u||f||!e.graph)&&(e.cssW=r,e.cssH=n,e.builtPairDist=e.pairDist,e.graph=Nc(e,r,n,e.pairDist),e.pulses.length=0,e.pending.length=0);let c=e.graph;if(!c){e.lineCount=0,e.pulseCount=0,e.starPeak.fill(0),e.starSum.fill(0),Hn(e,l),zn(e,t,o),Vn(e);return}if(a){if(e.hasSmooth){let v=1-Math.exp(-l/Fc);e.smoothX+=(a.x-e.smoothX)*v,e.smoothY+=(a.y-e.smoothY)*v}else e.smoothX=a.x,e.smoothY=a.y,e.hasSmooth=!0;e.cursorFade=Math.min(1,e.cursorFade+l/Lc)}else e.cursorFade=Math.max(0,e.cursorFade-l/Uc),e.cursorFade===0&&(e.hasSmooth=!1);let m=Math.max(1,e.linkRadius),g=Math.max(1,t.linkFormMs),b=Math.max(1,t.linkDissolveMs);for(let v of c.edges){let M=0;if(a&&e.hasSmooth){let y=c.sx[v.a],x=c.sy[v.a],T=c.sx[v.b]-y,R=c.sy[v.b]-x,C=Math.max(T*T+R*R,1e-4),w=Math.min(1,Math.max(0,((e.smoothX-y)*T+(e.smoothY-x)*R)/C)),p=Math.hypot(y+T*w-e.smoothX,x+R*w-e.smoothY)/m;p<1&&(M=ya((1-p)/.65))}v.prevPhase=v.phase,M>.02?(v.activeSince<0&&(v.activeSince=o),v.env=M,o-v.activeSince>v.stagger&&(v.phase=Math.min(1,v.phase+l/g))):(v.activeSince>=0&&(v.activeSince=-1,v.holdUntil=o+t.linkHoldMs),o>=v.holdUntil&&(v.phase=Math.max(0,v.phase-l/b),v.phase===0&&(v.env=0)))}if(t.pulseEnabled?jc(e,t,c,o):(e.pulses.length=0,e.pending.length=0),t.polygonFlashEnabled)for(let v of c.polygons){let M=!0;for(let y of v.edges){let x=c.edges[y];if(x.phase<_c||x.env<Wc){M=!1;break}}if(M&&o-e.lastFlashGlobal>Bc&&o-v.lastFlash>Ic){e.lastFlashGlobal=o,v.lastFlash=o;for(let y of v.edges){let x=c.edges[y];x.flashStart=o,e.flareStart[x.a]=o,e.flareStart[x.b]=o}}v.complete=M}e.starPeak.fill(0),e.starSum.fill(0);for(let v of c.edges){let M=qt(v.phase)*(.55+.45*v.env);M<=.01||(e.starSum[v.a]+=M,e.starSum[v.b]+=M,M>e.starPeak[v.a]&&(e.starPeak[v.a]=M),M>e.starPeak[v.b]&&(e.starPeak[v.b]=M))}Hn(e,l),zn(e,t,o),Vn(e);let S=0;for(let v of c.edges){if(S>=e.caps.maxLinks)break;let M=qt(v.phase)*(.62+.38*v.env);if(M<.008)continue;let y=(o-v.flashStart)/Ac,x=y>=0&&y<1?y<.16?ya(y/.16):1-qt((y-.16)/.84):0,T=S*4,R=S*2;e.segData[T]=e.starsX[v.a],e.segData[T+1]=e.starsY[v.a],e.segData[T+2]=e.starsX[v.b],e.segData[T+3]=e.starsY[v.b],e.fxData[R]=M,e.fxData[R+1]=x,S++}e.lineCount=S,t.pulseEnabled?$c(e,c,o):e.pulseCount=0}function Kc(e,t,a){return`#version 300 es
precision highp float;

uniform sampler2D uField;
uniform sampler2D uStars;
uniform sampler2D uStarFx;
uniform vec2 uCssSize;
uniform vec2 uCursor;
uniform float uCursorFade;
uniform float uLinkRadius;
uniform float uTime;
uniform int uStarCount;
uniform int uLineCount;
uniform int uPulseCount;
uniform vec4 uLineStyle;
uniform vec4 uStarStyle;
uniform vec3 uStarExtra;
uniform vec3 uPulseStyle;
uniform float uFlashStrength;
uniform vec4 uLineSeg[${t}];
uniform vec2 uLineFx[${t}];
uniform vec4 uPulseSeg[${a}];
uniform vec2 uPulseFx[${a}];

in vec2 vUv;
out vec4 outColor;

const float TAU = 6.2831853;

void main() {
  float sc = clamp(min(uCssSize.x, uCssSize.y) / 300.0, 0.6, 2.5);
  vec2 pos = vec2(vUv.x, 1.0 - vUv.y) * uCssSize;

  vec2 warp = vec2(0.0);
  float add = 0.0;
  float dim = 0.0;

  for (int i = 0; i < ${t}; i++) {
    if (i >= uLineCount) break;
    vec4 seg = uLineSeg[i];
    vec2 fx = uLineFx[i];
    vec2 a = seg.xy * uCssSize;
    vec2 b = seg.zw * uCssSize;
    vec2 pa = pos - a;
    vec2 ba = b - a;
    float len2 = max(dot(ba, ba), 1e-4);
    float h = clamp(dot(pa, ba) / len2, 0.0, 1.0);
    vec2 off = pa - ba * h;
    float d = length(off);
    float flash = fx.y * uFlashStrength;
    float lw = uLineStyle.x * (1.0 + 1.15 * flash) * sc;
    float reach = lw * 6.4;
    if (d > reach) continue;
    float alpha = fx.x * smoothstep(0.0, 0.05, h) * smoothstep(1.0, 0.95, h);
    if (alpha < 0.004) continue;
    vec2 tng = ba * inversesqrt(len2);
    vec2 nrm = vec2(-tng.y, tng.x);
    float side = dot(off, nrm) >= 0.0 ? 1.0 : -1.0;
    float t = d / reach;
    float prof = exp(-t * t * 2.4);
    float amp = uLineStyle.w * (1.0 + 1.15 * flash) * sc * alpha;
    warp += (nrm * 1.05 + tng * 0.3) * side * amp * prof;
    float shimmer = 0.94 + 0.06 * sin(uTime * 1.7 + (a.x + b.y) * 0.045);
    float core = smoothstep(lw * 0.92, lw * 0.1, d);
    float halo = smoothstep(lw * 2.1, lw * 0.85, d) * (1.0 - core);
    add += (core * (1.55 + 2.7 * flash) + halo * (0.4 + 0.55 * flash)) * alpha * shimmer * uLineStyle.y;
    float groove = smoothstep(lw * 4.6, lw * 1.6, d) * (1.0 - core) * (1.0 - 0.45 * halo);
    dim += groove * alpha * (1.05 + 0.8 * flash) * uLineStyle.z;
  }

  for (int i = 0; i < ${a}; i++) {
    if (i >= uPulseCount) break;
    vec4 seg = uPulseSeg[i];
    vec2 fx = uPulseFx[i];
    vec2 a = seg.xy * uCssSize;
    vec2 b = seg.zw * uCssSize;
    vec2 ba = b - a;
    float len = max(length(ba), 1e-3);
    vec2 tng = ba / len;
    vec2 nrm = vec2(-tng.y, tng.x);
    vec2 pa = pos - a;
    float along = dot(pa, tng);
    float perp = dot(pa, nrm);
    float wid = 3.0 * sc;
    if (abs(perp) > wid * 6.0) continue;
    float coreLen = uPulseStyle.x * sc;
    float tailLen = uPulseStyle.y * sc;
    float s = along - fx.x * len;
    if (s > coreLen * 3.0 || s < -tailLen * 1.7) continue;
    if (along < -coreLen * 2.0 || along > len + coreLen * 2.0) continue;
    float lateral = exp(-(perp * perp) / (wid * wid));
    float core = exp(-(s * s) / (coreLen * coreLen));
    float tail = s < 0.0 ? exp(s / tailLen) * (1.0 - core) : 0.0;
    add += (core * 2.1 + tail * 0.6) * lateral * fx.y * uPulseStyle.z;
    float side = perp >= 0.0 ? 1.0 : -1.0;
    float spread = exp(-(perp * perp) / (wid * wid * 22.0));
    float push = (core + 0.45 * tail) * spread * fx.y;
    warp += (nrm * side * 1.15 + tng * 0.22) * push * 15.5 * sc;
    dim += smoothstep(wid * 5.5, wid * 1.5, abs(perp)) * (core + 0.55 * tail) * fx.y * 0.72;
  }

  for (int i = 0; i < ${e}; i++) {
    if (i >= uStarCount) break;
    vec4 s = texelFetch(uStars, ivec2(i, 0), 0);
    vec2 fx = texelFetch(uStarFx, ivec2(i, 0), 0).rg;
    vec2 sp = s.xy * uCssSize;
    vec2 q = pos - sp;
    float d = length(q);
    float near = smoothstep(uLinkRadius, uLinkRadius * 0.25, distance(sp, uCursor)) * uCursorFade;
    float speed = (0.6 + fract(s.z * 13.71 + s.w * 3.93) * 1.7) * uStarExtra.y;
    float tw = (1.0 - uStarExtra.x) + uStarExtra.x * sin(uTime * speed + s.w * TAU);
    float grow = clamp(fx.x, 0.0, 1.0);
    float flare = clamp(fx.y, 0.0, 1.0);
    float rcBase = uStarStyle.x * (1.0 + uStarStyle.y * s.z) * sc * (1.0 + 0.22 * near) * (0.95 + 0.05 * tw);
    float reach = rcBase * 4.4 * (1.0 + 0.6 * flare);
    if (d > reach) continue;
    vec2 dir = d > 1e-4 ? q / d : vec2(0.0);
    float t = d / reach;
    float push = uStarStyle.z * (1.0 + 0.79 * s.z) * sc * (1.0 + 0.55 * near + 1.1 * flare);
    warp += dir * push * 3.3 * t * exp(-t * t * 2.0);
    float rc = rcBase * (1.0 + uStarStyle.w * grow + uStarExtra.z * flare);
    add += smoothstep(rc, rc * mix(0.28, 0.6, max(grow, flare)), d) * (0.92 + 0.16 * tw) * (1.0 + 0.55 * flare);
    float spikeX = exp(-abs(q.y) / (rc * 0.16)) * exp(-abs(q.x) / (rc * 1.35));
    float spikeY = exp(-abs(q.x) / (rc * 0.16)) * exp(-abs(q.y) / (rc * 1.35));
    add += (spikeX + spikeY) * tw * (0.24 + 0.22 * near + 0.62 * flare);
    float ring = smoothstep(rcBase * 2.9, rcBase * 1.5, d) * smoothstep(rcBase * 0.95, rcBase * 1.3, d);
    dim += ring * (0.42 + 0.14 * near + 0.3 * flare);
  }

  vec2 uv = clamp(vUv + vec2(warp.x / uCssSize.x, -warp.y / uCssSize.y), 0.0, 1.0);
  float base = texture(uField, uv).r;
  float value = clamp(base * (1.0 - min(dim, 0.9)) + add, 0.0, 1.0);
  outColor = vec4(vec3(value), 1.0);
}
`}function Jc(e,t,a){let r=V(e,Q,Kc(a.maxStars,a.maxLinks,a.maxPulses)),n=zc(a),o=Ve(e,n.starBytes,a.maxStars,1),l=Ve(e,n.starFxBytes,a.maxStars,1),i=e.getUniformLocation(r,"uField"),s=e.getUniformLocation(r,"uStars"),u=e.getUniformLocation(r,"uStarFx"),f=e.getUniformLocation(r,"uCssSize"),c=e.getUniformLocation(r,"uCursor"),m=e.getUniformLocation(r,"uCursorFade"),g=e.getUniformLocation(r,"uLinkRadius"),b=e.getUniformLocation(r,"uTime"),S=e.getUniformLocation(r,"uStarCount"),v=e.getUniformLocation(r,"uLineCount"),M=e.getUniformLocation(r,"uPulseCount"),y=e.getUniformLocation(r,"uLineStyle"),x=e.getUniformLocation(r,"uStarStyle"),T=e.getUniformLocation(r,"uStarExtra"),R=e.getUniformLocation(r,"uPulseStyle"),C=e.getUniformLocation(r,"uFlashStrength"),w=e.getUniformLocation(r,"uLineSeg"),p=e.getUniformLocation(r,"uLineFx"),E=e.getUniformLocation(r,"uPulseSeg"),D=e.getUniformLocation(r,"uPulseFx");return{render(L,H,U){let A=U.config;Yc(n,A,U.cursor,U.cssW,U.cssH,U.now),n.starsDirty&&=(wt(e,o,n.starBytes,a.maxStars,1),!1),wt(e,l,n.starFxBytes,a.maxStars,1),X(e,L),e.useProgram(r),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,H),e.uniform1i(i,0),e.activeTexture(e.TEXTURE1),e.bindTexture(e.TEXTURE_2D,o),e.uniform1i(s,1),e.activeTexture(e.TEXTURE2),e.bindTexture(e.TEXTURE_2D,l),e.uniform1i(u,2),e.uniform2f(f,U.cssW,U.cssH),e.uniform2f(c,n.hasSmooth?n.smoothX:-1e5,n.hasSmooth?n.smoothY:-1e5),e.uniform1f(m,n.cursorFade),e.uniform1f(g,Math.max(1,n.linkRadius)),e.uniform1f(b,U.timeSec),e.uniform1i(S,n.starCount),e.uniform1i(v,n.lineCount),e.uniform1i(M,n.pulseCount),e.uniform4f(y,A.linkThicknessPx,A.linkBrightness,A.linkGrooveDepth,A.linkShearPx),e.uniform4f(x,A.starSizePx,A.starSizeRandomness,A.starPushPx,A.starGrowScale),e.uniform3f(T,A.twinkleAmount,A.twinkleSpeed,A.flareScale),e.uniform3f(R,A.pulseCoreLenPx,A.pulseTailLenPx,A.pulseBrightness),e.uniform1f(C,A.polygonFlashEnabled?A.polygonFlashStrength:0),e.uniform4fv(w,n.segData),e.uniform2fv(p,n.fxData),e.uniform4fv(E,n.pulseSegData),e.uniform2fv(D,n.pulseFxData),t.draw()},dispose(){e.deleteProgram(r),e.deleteTexture(o),e.deleteTexture(l)}}}var Qc=300,Nn=.5,Xn=2.5,Zc=1/240,ef=12,qn=.7,tf=1.16,jn=.42,$n=1.22,af=10,rf=22,nf=12,of=130,lf=5,sf=70,uf=19/15,cf=3.2/2.6,Pt=7,ff=34,df=760,Yn=.12,Kn=.4,hf=4.3/2.9,Jn=10,pf=.14,mf=8,gf=.618033988749895,vf=Math.PI*2,Qn=50,Zn=.5,xf=16.7;function eo(e){return{nodeCount:Math.max(2,Math.round(e.nodeCount)),maxEmbers:Math.max(1,Math.round(e.emberMaxCount))}}function bf(e,t){let a=Math.min(e,t)/Qc;return a<Nn?Nn:a>Xn?Xn:a}function Sf(e,t){let a=Rt(t>>>0);return{caps:e,random:a,px:new Float32Array(e.nodeCount),py:new Float32Array(e.nodeCount),vx:new Float32Array(e.nodeCount),vy:new Float32Array(e.nodeCount),nodeData:new Float32Array(e.nodeCount*2),radiusData:new Float32Array(e.nodeCount),emberState:new Float32Array(e.maxEmbers*Pt),emberData:new Float32Array(e.maxEmbers*4),emberCount:0,emitAccum:0,lifePhase:a(),x:0,y:0,velX:0,velY:0,presence:0,core:0,wasActive:!1,lastNow:-1}}function Cr(e){return e<0?0:e>1?1:e}function yf(e,t,a){for(let r=0;r<e.caps.nodeCount;r++)e.px[r]=t,e.py[r]=a,e.vx[r]=0,e.vy[r]=0}function Mf(e,t,a,r,n,o){let{px:l,py:i,vx:s,vy:u}=e,f=e.caps.nodeCount;s[0]+=(t.headStiffness*(r-l[0])-t.headDamping*s[0])*a,u[0]+=(t.headStiffness*(n-i[0])-t.headDamping*u[0])*a,l[0]+=s[0]*a,i[0]+=u[0]*a;for(let c=1;c<f;c++){s[c]+=(t.chainStiffness*(l[c-1]-l[c])-t.chainDamping*s[c])*a,u[c]+=(t.chainStiffness*(i[c-1]-i[c])-t.chainDamping*u[c])*a,l[c]+=s[c]*a,i[c]+=u[c]*a;let m=l[c]-l[c-1],g=i[c]-i[c-1],b=Math.hypot(m,g);if(b>o&&b>1e-4){let S=m/b,v=g/b;l[c]=l[c-1]+S*o,i[c]=i[c-1]+v*o;let M=s[c]*S+u[c]*v;M>0&&(s[c]-=S*M*qn,u[c]-=v*M*qn)}}}function wf(e,t,a){let{px:r,py:n,nodeData:o,radiusData:l}=e,i=e.caps.nodeCount,s=i-1;for(let u=0;u<i;u++)o[u*2]=r[u],o[u*2+1]=n[u];for(let u=0;u<i;u++){let f=u===0?0:u-1,c=u===s?s:u+1,m=Math.hypot(r[c]-r[f],n[c]-n[f])/(c-f||1),g=s>0?u/s:0,b=(t.headRadiusPx+(t.tailRadiusPx-t.headRadiusPx)*g)*a,S=tf-t.stretchThinning*m/(af*a);l[u]=b*(S<jn?jn:S>$n?$n:S)}}function Pf(e,t,a,r,n,o,l,i,s){if(e.emberCount>=e.caps.maxEmbers)return;let u=e.random,f=e.emberCount*Pt;e.emberCount+=1;let c=u(),m=(s>mf?Math.atan2(-i,-l):u()*vf)+(u()-.5)*2*t.emberSpreadRad,g=t.emberSpeedMinPxPerSec+u()*(t.emberSpeedMaxPxPerSec-t.emberSpeedMinPxPerSec);e.lifePhase=(e.lifePhase+gf)%1;let b=(e.lifePhase+u()*pf)%1;e.emberState[f]=a+(n-a)*c+(u()-.5)*Jn,e.emberState[f+1]=r+(o-r)*c+(u()-.5)*Jn,e.emberState[f+2]=Math.cos(m)*g,e.emberState[f+3]=Math.sin(m)*g,e.emberState[f+4]=0,e.emberState[f+5]=t.emberLifetimeMinMs+b*(t.emberLifetimeMaxMs-t.emberLifetimeMinMs),e.emberState[f+6]=t.emberSizePx*(1+u()*hf)}function Cf(e,t,a,r,n,o,l,i,s,u){let f=Cr((s-ff)/df);if(f<=0){e.emitAccum>Kn&&(e.emitAccum=Kn);return}for(e.emitAccum+=(Yn+(1-Yn)*f)*t.emberRatePerSec*u;e.emitAccum>=1;)--e.emitAccum,Pf(e,t,a,r,n,o,l,i,s)}function Tf(e,t){let a=t/1e3,r=e.emberState,n=0;for(;n<e.emberCount;){let o=n*Pt,l=r[o+4]+t;if(l>=r[o+5]){--e.emberCount;let i=e.emberCount*Pt;i!==o&&r.copyWithin(o,i,i+Pt);continue}r[o+4]=l,r[o]+=r[o+2]*a,r[o+1]+=r[o+3]*a,n+=1}}function Rf(e){let t=e.emberState;for(let a=0;a<e.emberCount;a++){let r=a*Pt,n=a*4;e.emberData[n]=t[r],e.emberData[n+1]=t[r+1],e.emberData[n+2]=t[r+6],e.emberData[n+3]=t[r+4]/t[r+5]}}function Ef(e,t,a,r,n,o){let l=e.lastNow<0?xf:o-e.lastNow,i=l<Zn?Zn:l>Qn?Qn:l;e.lastNow=o;let s=i/1e3,u=bf(r,n),f=a!==null;a&&!e.wasActive&&(e.x=a.x,e.y=a.y,e.velX=0,e.velY=0,yf(e,a.x,a.y));let c=e.x,m=e.y;a&&(e.x=a.x,e.y=a.y);let g=(e.x-c)/s,b=(e.y-m)/s,S=Math.hypot(g,b),v=1-Math.exp(-s*rf);e.velX+=(g-e.velX)*v,e.velY+=(b-e.velY)*v;let M=Math.hypot(e.velX,e.velY),y=Cr((M-nf)/of),x=f?y**.6:0,T=x>e.presence?t.presenceRiseRate:t.presenceFallRate;e.presence+=(x-e.presence)*(1-Math.exp(-s*T));let R=Cr((M-lf)/sf),C=f?R**.6:0,w=C>e.core?t.presenceRiseRate*uf:t.presenceFallRate*cf;e.core+=(C-e.core)*(1-Math.exp(-s*w)),f&&e.wasActive&&t.embersEnabled&&Cf(e,t,c,m,e.x,e.y,g,b,S,s),e.wasActive=f,Tf(e,i),Rf(e);let p=Math.min(ef,Math.max(1,Math.ceil(s/Zc))),E=s/p,D=t.maxLinkPx*u;for(let L=0;L<p;L++)Mf(e,t,E,e.x,e.y,D);wf(e,t,u)}function Af(e){return`#version 300 es
precision highp float;

uniform sampler2D uField;
uniform sampler2D uHeat;
uniform vec2 uCssSize;
uniform vec2 uNode[${e}];
uniform float uNodeR[${e}];
uniform float uPresence;
uniform float uCore;
uniform float uTime;
uniform float uSmoothUnionPx;
uniform vec4 uStyle;

in vec2 vUv;
out vec4 outColor;

float smoothUnion(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

float bodyDist(vec2 p, float sc) {
  float k = max(uSmoothUnionPx * sc, 1e-3);
  float d = 1e5;
  for (int i = 0; i < ${Math.max(1,e-1)}; i++) {
    vec2 a = uNode[i];
    vec2 b = uNode[i + 1];
    vec2 ab = b - a;
    float t = clamp(dot(p - a, ab) / max(dot(ab, ab), 1e-4), 0.0, 1.0);
    float r = mix(uNodeR[i], uNodeR[i + 1], t);
    float seg = length(p - (a + ab * t)) - r;
    d = i == 0 ? seg : smoothUnion(d, seg, k);
  }
  return d;
}

float bodyCore(float d, float sc) {
  return 1.0 - smoothstep(-1.15 * sc, 0.15 * sc, d);
}

float bodyRing(float d, float sc) {
  return smoothstep(-0.25 * sc, 1.15 * sc, d) * (1.0 - smoothstep(0.35 * sc, 4.4 * sc, d));
}

float bodyPush(vec2 p, float sc) {
  return (1.0 - smoothstep(-1.5 * sc, 5.0 * sc, bodyDist(p, sc))) * 0.52;
}

float headBulge(vec2 p) {
  float r = max(uNodeR[0] * 1.12, 1.0);
  return 1.0 - smoothstep(0.34, 1.0, length(p - uNode[0]) / r);
}

void main() {
  float sc = clamp(min(uCssSize.x, uCssSize.y) / 300.0, 0.5, 2.5);
  vec2 p = vec2(vUv.x, 1.0 - vUv.y) * uCssSize;

  float e = 2.0 * sc;
  float gx = bodyPush(p + vec2(e, 0.0), sc) - bodyPush(p - vec2(e, 0.0), sc);
  float gy = bodyPush(p + vec2(0.0, e), sc) - bodyPush(p - vec2(0.0, e), sc);
  vec2 push = vec2(gx, gy) / (2.0 * e) * 340.0 * sc * uPresence;
  float mag = length(push);
  float maxPush = uStyle.z * sc;
  if (mag > maxPush) push *= maxPush / max(mag, 1e-5);

  vec2 uv = clamp(vUv + vec2(push.x / uCssSize.x, -push.y / uCssSize.y), 0.0, 1.0);
  float base = texture(uField, uv).r;

  float ember = clamp(texture(uHeat, vUv).g * uStyle.w, 0.0, 1.0);
  float dc = bodyDist(p, sc);
  float core = bodyCore(dc, sc) * uPresence;
  float flick = 0.9 + 0.1 * sin(uTime * 11.3 + sin(uTime * 27.1) * 1.7);
  float head = clamp(headBulge(p) * uCore * uPresence * flick, 0.0, 1.0);

  float aura = bodyRing(dc, sc) * uPresence;
  float dim = clamp(aura * 0.74 * uStyle.y, 0.0, 0.84);

  float lit = base * (1.0 - dim);
  float lum = clamp(mix(0.93, 1.0, head) * uStyle.x, 0.0, 1.0);
  float value = clamp(mix(mix(lit, lum, core), 1.0, ember), 0.0, 1.0);
  outColor = vec4(vec3(value), 1.0);
}
`}var kf=`#version 300 es
precision highp float;

in vec2 vLocal;
in float vT;
uniform float uFadeIn;
out vec4 outColor;

void main() {
  float r = length(vLocal);
  float disc = 1.0 - smoothstep(0.46, 0.58, r);
  float t = clamp(vT, 0.0, 1.0);
  float amp = smoothstep(0.0, max(uFadeIn, 1e-3), t) * (1.0 - smoothstep(0.58, 1.0, t));
  outColor = vec4(0.0, disc * amp, 0.0, 1.0);
}
`,Df=`#version 300 es
precision highp float;

in vec4 aEmber;
uniform vec2 uCanvas;
out vec2 vLocal;
out float vT;

void main() {
  vec2 corner = vec2(
    float(gl_VertexID == 1 || gl_VertexID == 4 || gl_VertexID == 5),
    float(gl_VertexID == 2 || gl_VertexID == 3 || gl_VertexID == 5)
  );
  vec2 local = (corner - 0.5) * 2.0;
  vec2 worldPx = aEmber.xy + local * aEmber.z * 3.2;
  vec2 uv = worldPx / uCanvas;
  gl_Position = vec4(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0, 0.0, 1.0);
  vLocal = local * 3.2;
  vT = aEmber.w;
}
`;function Ff(e,t,a){let r=V(e,Q,Af(a.nodeCount)),n=V(e,Df,kf),o=e.createVertexArray(),l=e.createBuffer();if(!o||!l)throw e.deleteProgram(r),e.deleteProgram(n),o&&e.deleteVertexArray(o),l&&e.deleteBuffer(l),Error("Failed to create comet trail GL objects");e.bindVertexArray(o),e.bindBuffer(e.ARRAY_BUFFER,l);let i=e.getAttribLocation(n,"aEmber");e.enableVertexAttribArray(i),e.vertexAttribPointer(i,4,e.FLOAT,!1,16,0),e.vertexAttribDivisor(i,1),e.bindVertexArray(null),e.bindBuffer(e.ARRAY_BUFFER,null);let s=e.getUniformLocation(r,"uField"),u=e.getUniformLocation(r,"uHeat"),f=e.getUniformLocation(r,"uCssSize"),c=e.getUniformLocation(r,"uNode[0]"),m=e.getUniformLocation(r,"uNodeR[0]"),g=e.getUniformLocation(r,"uPresence"),b=e.getUniformLocation(r,"uCore"),S=e.getUniformLocation(r,"uTime"),v=e.getUniformLocation(r,"uSmoothUnionPx"),M=e.getUniformLocation(r,"uStyle"),y=e.getUniformLocation(n,"uCanvas"),x=e.getUniformLocation(n,"uFadeIn"),T=null,R=-1,C=null;return{render(w,p,E){let D=E.config;(!T||D.seed!==R)&&(R=D.seed,T=Sf(a,R)),Ef(T,D,E.cursor,E.cssW,E.cssH,E.now),C?ba(e,C,w.width,w.height):C=rt(e,w.width,w.height,{linear:!0}),X(e,C),e.clearColor(0,0,0,1),e.clear(e.COLOR_BUFFER_BIT),D.embersEnabled&&T.emberCount>0&&(e.useProgram(n),e.uniform2f(y,Math.max(1,E.cssW),Math.max(1,E.cssH)),e.uniform1f(x,D.emberFadeInFraction),e.bindVertexArray(o),e.bindBuffer(e.ARRAY_BUFFER,l),e.bufferData(e.ARRAY_BUFFER,T.emberData.subarray(0,T.emberCount*4),e.DYNAMIC_DRAW),e.bindBuffer(e.ARRAY_BUFFER,null),e.enable(e.BLEND),e.blendFunc(e.ONE,e.ONE),e.drawArraysInstanced(e.TRIANGLES,0,6,T.emberCount),e.disable(e.BLEND),e.bindVertexArray(null)),X(e,w),e.useProgram(r),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,p),e.uniform1i(s,0),e.activeTexture(e.TEXTURE1),e.bindTexture(e.TEXTURE_2D,C.texture),e.uniform1i(u,1),e.activeTexture(e.TEXTURE0),e.uniform2f(f,Math.max(1,E.cssW),Math.max(1,E.cssH)),e.uniform2fv(c,T.nodeData),e.uniform1fv(m,T.radiusData),e.uniform1f(g,T.presence),e.uniform1f(b,T.core),e.uniform1f(S,E.timeSec),e.uniform1f(v,D.smoothUnionPx),e.uniform4f(M,D.bodyBrightness,D.auraStrength,D.bodyPushPx,D.emberBrightness),t.draw()},dispose(){e.deleteProgram(r),e.deleteProgram(n),e.deleteVertexArray(o),e.deleteBuffer(l),C&&=(Ye(e,C),null),T=null}}}var Lf=1835365477,Uf=.15,Bf=11,If=1.5,_f=12,to=.08;function ao(e){return{maxActive:Math.max(1,Math.round(e.maxActive))}}function Wf(e,t){return{caps:e,random:Rt((t^Lf)>>>0),meteors:[],nextArrivalSec:0,hasArrival:!1,spawnCount:0,count:0,originData:new Float32Array(e.maxActive*4),shapeData:new Float32Array(e.maxActive*4)}}function Wt(e,t,a){return t+(a-t)*e()}function ro(e){let t=e<0?0:e>1?1:e;return t*t*(3-2*t)}function no(e,t){let a=1/Math.max(.02,t),r=Math.min(.999999,Math.max(1e-6,e.random())),n=-Math.log(1-r)*a,o=a*Uf,l=a*Bf;return n<o?o:n>l?l:n}function Gf(e,t,a,r){if(e<0||e>t)return 0;let n=a>0?ro(e/a):1,o=Math.min(r,t),l=n*(o>0?1-ro((e-(t-o))/o):1);return l<0?0:l>1?1:l}function Of(e,t,a,r,n){let o=e.random;if(e.meteors.length>=e.caps.maxActive){let S=0;for(let v=1;v<e.meteors.length;v++)e.meteors[v].bornAtSec<e.meteors[S].bornAtSec&&(S=v);e.meteors.splice(S,1)}let l=t.radiantAngleDeg*Math.PI/180,i=Math.cos(l),s=Math.sin(l),u=Math.abs(i)*Math.max(1,r),f=Math.abs(s)*Math.max(1,a),c=o()*(u+f)<f,m,g;c?(g=s>0?-(to+o()*.32):1.08+o()*.32,m=(i>0?-.45:-.05)+o()*1.5):(m=i>0?-(to+o()*.34):1.08+o()*.34,g=(s>0?-.05:.3)+o()*.75);let b=t.angleJitterDeg*Math.PI/180;e.meteors.push({spawnX:m,spawnY:g,bornAtSec:n,lifetimeSec:Wt(o,t.lifetimeMinMs,t.lifetimeMaxMs)/1e3,angleOffset:Wt(o,-b,b),speedMul:t.speedScale*Wt(o,1-t.speedVariation,1+t.speedVariation),lengthMul:t.tailLengthScale*Wt(o,1-t.tailLengthVariation,1+t.tailLengthVariation),thicknessMul:t.thicknessScale*Wt(o,1-t.thicknessVariation,1+t.thicknessVariation)}),e.spawnCount++}function zf(e,t,a,r,n){for(let u=e.meteors.length-1;u>=0;u--){let f=e.meteors[u];n-f.bornAtSec>f.lifetimeSec&&e.meteors.splice(u,1)}e.hasArrival||=(e.nextArrivalSec=n+no(e,t.ratePerSec)*.35,!0),n-e.nextArrivalSec>If&&(e.nextArrivalSec=n);let o=0;for(;n>=e.nextArrivalSec&&o<_f;)Of(e,t,a,r,e.nextArrivalSec),e.nextArrivalSec+=no(e,t.ratePerSec),o++;let l=t.fadeInMs/1e3,i=t.fadeOutMs/1e3;e.originData.fill(0),e.shapeData.fill(0);let s=0;for(let u of e.meteors){if(s>=e.caps.maxActive)break;let f=n-u.bornAtSec,c=Gf(f,u.lifetimeSec,l,i);if(c<=0)continue;let m=s*4;e.originData[m]=u.spawnX,e.originData[m+1]=u.spawnY,e.originData[m+2]=f,e.originData[m+3]=c,e.shapeData[m]=u.angleOffset,e.shapeData[m+1]=u.speedMul,e.shapeData[m+2]=u.lengthMul,e.shapeData[m+3]=u.thicknessMul,s++}e.count=s}function Hf(e){return`#version 300 es
precision highp float;

const int MAX_METEORS = ${e};
const float PUSH_PEAK = 1.1658;

uniform sampler2D uField;
uniform vec2 uCssSize;
uniform vec2 uRadiant;
uniform vec4 uStyle;
uniform int uMeteorCount;
uniform vec4 uMeteorOrigin[MAX_METEORS];
uniform vec4 uMeteorShape[MAX_METEORS];

in vec2 vUv;
out vec4 outColor;

vec2 rotateVector(vec2 value, float angle) {
  float cosine = cos(angle);
  float sine = sin(angle);
  return vec2(cosine * value.x - sine * value.y, sine * value.x + cosine * value.y);
}

float pushProfile(float radius, float width) {
  float normalized = radius / max(width, 0.001);
  return normalized * exp(1.0 - normalized * normalized);
}

void meteorContribution(
  vec2 point,
  vec4 origin,
  vec4 shape,
  float diagonal,
  float scale,
  inout vec2 warp,
  inout float light,
  inout float carve
) {
  float age = origin.z;
  float envelope = origin.w;
  if (envelope <= 0.0) return;

  vec2 direction = rotateVector(normalize(uRadiant), shape.x);
  float speed = diagonal * 0.807 * shape.y;
  float tailLength = diagonal * 0.38 * shape.z;
  float bulk = max(0.05, shape.w) * scale;

  vec2 head = origin.xy * uCssSize + direction * speed * age;
  vec2 relative = point - head;
  float visibleTail = min(tailLength, speed * age);
  float behind = clamp(-dot(relative, direction), 0.0, visibleTail);
  vec2 closest = head - direction * behind;
  vec2 offset = point - closest;
  float axisDistance = length(offset);
  float progress = behind / max(1.0, tailLength);
  float taper = pow(1.0 - clamp(progress, 0.0, 1.0), 0.6);

  float channelWidth = (5.5125 + 9.8 * taper) * bulk;
  float pushWidth = max(0.5, channelWidth * uStyle.w);
  float amount = (pushProfile(axisDistance, pushWidth) / PUSH_PEAK) * uStyle.z * envelope * taper;
  vec2 pushDirection = axisDistance > 0.0001 ? offset / axisDistance : vec2(-direction.y, direction.x);
  warp -= pushDirection * amount;

  float drag = exp(-axisDistance / max(1.0, pushWidth * 1.1)) * envelope * taper * uStyle.z * 1.12;
  warp -= direction * drag;

  float coreWidth = (1.8375 + 4.41 * taper) * bulk;
  carve = max(carve, exp(-(axisDistance * axisDistance) / (coreWidth * coreWidth * 4.0)) * envelope * taper);

  float streak = 1.0 - smoothstep(coreWidth * 0.35, coreWidth * 1.5, axisDistance);
  light = max(light, streak * envelope * (0.55 + 0.45 * taper) * uStyle.x);

  float headDistance = length(relative);
  float headRadius = 11.6375 * bulk;
  light = max(light, (1.0 - smoothstep(headRadius * 0.2, headRadius, headDistance)) * envelope * uStyle.y);

  float bow = (pushProfile(headDistance, max(0.5, headRadius * 1.2 * uStyle.w)) / PUSH_PEAK) * uStyle.z * 0.9 * envelope;
  vec2 bowDirection = headDistance > 0.0001 ? relative / headDistance : direction;
  warp -= bowDirection * bow;
}

void main() {
  vec2 point = vec2(vUv.x, 1.0 - vUv.y) * uCssSize;
  float diagonal = length(uCssSize);
  float scale = clamp(min(uCssSize.x, uCssSize.y) / 300.0, 0.55, 2.4);

  vec2 warp = vec2(0.0);
  float light = 0.0;
  float carve = 0.0;
  for (int index = 0; index < MAX_METEORS; index++) {
    if (index >= uMeteorCount) break;
    meteorContribution(point, uMeteorOrigin[index], uMeteorShape[index], diagonal, scale, warp, light, carve);
  }

  vec2 uv = clamp(vUv + vec2(warp.x, -warp.y) / uCssSize, 0.0, 1.0);
  float base = texture(uField, uv).r;
  float value = base * (1.0 - carve * 0.85);
  value = clamp(value + light, 0.0, 1.0);
  outColor = vec4(vec3(value), 1.0);
}
`}function Vf(e,t,a){let r=V(e,Q,Hf(a.maxActive)),n=null,o=-1,l=e.getUniformLocation(r,"uField"),i=e.getUniformLocation(r,"uCssSize"),s=e.getUniformLocation(r,"uRadiant"),u=e.getUniformLocation(r,"uStyle"),f=e.getUniformLocation(r,"uMeteorCount"),c=e.getUniformLocation(r,"uMeteorOrigin[0]"),m=e.getUniformLocation(r,"uMeteorShape[0]");return{render(g,b,S){let v=S.config;(!n||v.seed!==o)&&(o=v.seed,n=Wf(a,o)),zf(n,v,S.cssW,S.cssH,S.timeSec);let M=v.radiantAngleDeg*Math.PI/180;X(e,g),e.useProgram(r),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,b),e.uniform1i(l,0),e.uniform2f(i,Math.max(1,S.cssW),Math.max(1,S.cssH)),e.uniform2f(s,Math.cos(M),Math.sin(M)),e.uniform4f(u,v.brightness,v.headGlow,v.pushPx,v.pushFalloffScale),e.uniform1i(f,n.count),e.uniform4fv(c,n.originData),e.uniform4fv(m,n.shapeData),t.draw()},dispose(){e.deleteProgram(r)}}}var Nf=1684370543,Xf=96,qf=22;function sr(e){return{maxConcurrent:Math.max(1,Math.round(e.maxConcurrent)),debrisCount:Math.max(0,Math.round(e.debrisCount))}}function jf(e,t){return{caps:e,random:Rt((t^Nf)>>>0),detonations:[],count:0,spawnCount:0,centerData:new Float32Array(e.maxConcurrent*2),lifeData:new Float32Array(e.maxConcurrent*4)}}function $f(e){let t=e.debrisLifetimeMs/1e3*(1+e.debrisLifetimeVariation),a=e.ringDurationMs/1e3,r=e.craterLifeMs/1e3;return Math.max(t,a,r)}function Yf(e){return 3*e*(1-e)*(1-e)*.6+e*e*e}function Kf(e){return 3*e*(1-e)*(1-e)*.6+3*e*e*(1-e)+e*e*e}function Jf(e){if(e<=0)return 0;if(e>=1)return 1;let t=0,a=1,r=e;for(let n=0;n<qf;n++)r=(t+a)*.5,Yf(r)<e?t=r:a=r;return Kf(r)}function Qf(e,t,a,r,n){let o=Math.max(1,Math.min(e.caps.maxConcurrent,Math.round(t.maxConcurrent)));e.detonations.length>=o&&e.detonations.splice(0,e.detonations.length-o+1),e.detonations.push({x:a,y:r,seed:1+e.random()*Xf,bornAtSec:n}),e.spawnCount++}function Zf(e,t,a){let r=$f(t);for(let l=e.detonations.length-1;l>=0;l--)a-e.detonations[l].bornAtSec>r&&e.detonations.splice(l,1);let n=t.flashDurationMs/1e3;e.centerData.fill(0),e.lifeData.fill(0);let o=0;for(let l of e.detonations){if(o>=e.caps.maxConcurrent)break;let i=Math.max(0,a-l.bornAtSec);e.centerData[o*2]=l.x,e.centerData[o*2+1]=l.y;let s=o*4;e.lifeData[s]=i,e.lifeData[s+1]=l.seed,e.lifeData[s+2]=Jf(n>0?Math.min(1,i/n):1),e.lifeData[s+3]=1,o++}e.count=o}function ed(e,t){return`#version 300 es
precision highp float;

const int MAX_DETONATIONS = ${e};
const int DEBRIS_COUNT = ${t};
const float TAU = 6.2831853;
const float CRATER_PUNCH = 0.12;
const float CRATER_RIM = 0.4;
const float FLASH_GROW = 1.75;
const float FLASH_GLOW_SCALE = 2.9167;
const float FLASH_GLOW_AMOUNT = 0.6;
const float FLASH_GLOW_DECAY = 14.0;
const float RING_END_THICKNESS_RATIO = 0.375;
const float RING_LENS_THICKNESS = 1.0833;
const float RING_LENS_RATIO = 0.5;
const float CRATER_WARP_SCALE = 0.18;
const float CRATER_BAND_SCALE = 0.8;
const float DEBRIS_SIZE_SPREAD = 1.0;
const float DEBRIS_DRAG_SPREAD = 0.1935;
const float DEBRIS_STREAK_SEC = 0.045;
const float DEBRIS_REACH_MARGIN = 1.1;

uniform sampler2D uField;
uniform vec2 uCssSize;
uniform int uDetCount;
uniform vec2 uDetCenter[MAX_DETONATIONS];
uniform vec4 uDetLife[MAX_DETONATIONS];
uniform vec4 uRing;
uniform vec4 uFlash;
uniform vec4 uDebrisA;
uniform vec4 uDebrisB;
uniform vec4 uCrater;
uniform vec4 uCraterExtra;

in vec2 vUv;
out vec4 outColor;

float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

float shockRadius(float ts, float sc) {
  return uRing.x * sc * pow(ts, 0.42);
}

float shockWobble(float ang, float seed, float ts) {
  return (sin(ang * 5.0 + seed * 11.0) + 0.6 * sin(ang * 9.0 - seed * 7.0) + 0.4 * sin(ang * 13.0 + seed * 3.0)) *
    3.4 * ts;
}

float craterPower(float seed) {
  return 0.86 + 0.3 * hash11(seed * 1.73 + 5.11);
}

float craterAmp(float t) {
  float life = uCraterExtra.x;
  if (t < 0.0 || t > life) return 0.0;
  float punch = 1.0 - pow(1.0 - clamp(t / CRATER_PUNCH, 0.0, 1.0), 2.6);
  float d = max(t - CRATER_PUNCH, 0.0);
  float fast = exp(-d / max(1e-4, uCrater.z));
  float slow = exp(-d / max(1e-4, uCrater.w));
  float tail = smoothstep(life, life * 0.7, t);
  float defer = mix(0.42, 1.0, smoothstep(0.1, 0.58, t));
  return punch * (0.64 * slow + 0.36 * fast) * tail * defer;
}

float craterRadius(float t, float sc, float seed, float ang) {
  float rim = uCraterExtra.y;
  float grow = 0.34 + 0.66 * (1.0 - pow(1.0 - clamp(t / CRATER_PUNCH, 0.0, 1.0), 2.6));
  float over = 1.0 + 0.12 * rim * sin(3.14159265 * clamp((t - CRATER_PUNCH) / CRATER_RIM, 0.0, 1.0));
  float wob = 1.0 + 0.055 * sin(ang * 3.0 + seed * 7.0) + 0.03 * sin(ang * 5.0 - seed * 3.7);
  float settle = 1.0 - 0.06 * smoothstep(CRATER_PUNCH + CRATER_RIM, uCraterExtra.x * 0.8, t);
  return uCrater.x * sc * grow * over * wob * settle;
}

float craterProfile(float u) {
  float bowl = u * exp(0.5 - 0.5 * u * u);
  float lobe = -0.24 * exp(-pow((u - 1.72) * 1.5, 2.0));
  return bowl + lobe;
}

float craterBands(float u) {
  float rim = exp(-pow((u - 1.0) / 0.32, 2.0));
  float bowl = exp(-pow(u / 0.66, 2.0));
  return (0.26 * rim - 0.2 * bowl) * uCraterExtra.y;
}

void main() {
  float sc = clamp(min(uCssSize.x, uCssSize.y) / 300.0, 0.5, 2.5);
  vec2 pos = vec2(vUv.x, 1.0 - vUv.y) * uCssSize;
  float ringSec = max(1e-4, uRing.y);
  float debrisSec = max(1e-4, uDebrisB.x);
  float debrisDrag = max(0.05, uDebrisA.z);
  float debrisSpan = debrisSec * (1.0 + uDebrisB.y);
  float debrisReach =
    (uDebrisA.x * (1.0 + uDebrisA.y) / debrisDrag + uDebrisA.w * debrisSpan / debrisDrag + uDebrisB.z * 2.0) *
    DEBRIS_REACH_MARGIN;

  vec2 warp = vec2(0.0);
  float craterDelta = 0.0;
  for (int i = 0; i < MAX_DETONATIONS; i++) {
    if (i >= uDetCount) break;
    float t = uDetLife[i].x;
    if (t > uCraterExtra.x) continue;
    float amp = craterAmp(t);
    if (amp <= 0.0) continue;
    float seed = uDetLife[i].y;
    float power = craterPower(seed);
    vec2 d = pos - uDetCenter[i];
    float r = max(length(d), 1e-3);
    vec2 dir = d / r;
    float ang = atan(d.y, d.x);
    float R = craterRadius(t, sc, seed, ang) * power;
    float u = r / R;
    warp -= dir * craterProfile(u) * amp * power * CRATER_WARP_SCALE * uCrater.y * R;
    craterDelta += craterBands(u) * amp * power * CRATER_BAND_SCALE;
  }

  for (int i = 0; i < MAX_DETONATIONS; i++) {
    if (i >= uDetCount) break;
    float ts = uDetLife[i].x / ringSec;
    if (ts >= 1.0) continue;
    float seed = uDetLife[i].y;
    vec2 d = pos - uDetCenter[i];
    float r = max(length(d), 1e-3);
    vec2 dir = d / r;
    float ang = atan(d.y, d.x);
    float R = shockRadius(ts, sc) + shockWobble(ang, seed, ts) * sc;
    float th = mix(uRing.z, uRing.z * RING_END_THICKNESS_RATIO, ts) * sc;
    float band = (r - R) / th;
    float g = exp(-band * band);
    float w = pow(1.0 - ts, 0.85);
    warp += dir * band * g * uRing.w * sc * w;

    float lensTh = th * RING_LENS_THICKNESS;
    float lensBand = (r - R) / lensTh;
    float lensG = exp(-lensBand * lensBand);
    float lensW = pow(1.0 - ts, 0.9);
    warp += dir * lensBand * lensG * uRing.w * RING_LENS_RATIO * sc * lensW;
  }
  vec2 uv = clamp(vUv + vec2(warp.x / uCssSize.x, -warp.y / uCssSize.y), 0.0, 1.0);
  float base = texture(uField, uv).r;

  float add = 0.0;
  float dim = 0.0;
  for (int i = 0; i < MAX_DETONATIONS; i++) {
    if (i >= uDetCount) break;
    float age = uDetLife[i].x;
    float seed = uDetLife[i].y;
    vec2 d = pos - uDetCenter[i];
    float r = max(length(d), 1e-3);
    float ang = atan(d.y, d.x);

    float f = uDetLife[i].z;
    if (f < 1.0) {
      float coreR = mix(uFlash.x, uFlash.x * FLASH_GROW, f) * sc;
      add += smoothstep(coreR, coreR * 0.25, r) * (1.0 - f) * uFlash.y;
    }
    add += exp(-r / (uFlash.x * FLASH_GLOW_SCALE * sc)) * exp(-age * FLASH_GLOW_DECAY) * FLASH_GLOW_AMOUNT * uFlash.y;

    float ts = age / ringSec;
    if (ts < 1.0) {
      float R = shockRadius(ts, sc) + shockWobble(ang, seed, ts) * sc;
      float th = mix(uRing.z, uRing.z * RING_END_THICKNESS_RATIO, ts) * sc;
      float band = (r - R) / th;
      float g = exp(-band * band);
      float w = pow(1.0 - ts, 0.85);
      float grain = 0.82 + 0.18 * sin(ang * 23.0 + seed * 29.0 + ts * 9.0);
      add += g * w * 0.8 * grain;
      float behind = (r - (R - th * 1.9)) / (th * 1.4);
      dim += exp(-behind * behind) * w * 0.24 * smoothstep(0.08, 0.4, ts);
    }

    if (DEBRIS_COUNT > 0 && age < debrisSpan && r < debrisReach * sc) {
      for (int j = 0; j < DEBRIS_COUNT; j++) {
        float fj = float(j);
        float h1 = hash11(seed + fj * 7.13);
        float h2 = hash11(seed + fj * 3.71 + 11.7);
        float h3 = hash11(seed + fj * 5.39 + 29.3);
        float h4 = hash11(seed + fj * 9.02 + 47.9);
        float h5 = hash11(seed + fj * 1.97 + 71.3);
        float life = debrisSec * (1.0 + uDebrisB.y * h3);
        float tt = age / life;
        if (tt >= 1.0) continue;
        float angJ = (fj + (h1 - 0.5) * 0.9) * (TAU / float(DEBRIS_COUNT));
        vec2 dirJ = vec2(cos(angJ), sin(angJ));
        float v0 = uDebrisA.x * (1.0 + uDebrisA.y * h2 * h2) * sc;
        float k = uDebrisA.z * (1.0 + DEBRIS_DRAG_SPREAD * h4);
        float ds = (1.0 - exp(-k * age)) / k;
        float grav = uDebrisA.w * sc;
        vec2 pPos = uDetCenter[i] + dirJ * v0 * ds + vec2(0.0, grav * (age - ds) / k);
        vec2 vel = dirJ * v0 * exp(-k * age) + vec2(0.0, grav * (1.0 - exp(-k * age)) / k);
        vec2 seg = -vel * DEBRIS_STREAK_SEC;
        float segLen2 = max(dot(seg, seg), 1e-4);
        float proj = clamp(dot(pos - pPos, seg) / segLen2, 0.0, 1.0);
        float distSeg = length(pos - (pPos + seg * proj));
        float size = uDebrisB.z * (1.0 + DEBRIS_SIZE_SPREAD * h5) * sc * (1.0 - 0.45 * tt);
        float cool = pow(1.0 - tt, 1.4);
        float flicker = mix(1.0, 0.55 + 0.45 * sin(age * 34.0 + fj * 9.7 + seed), smoothstep(0.35, 0.9, tt));
        add += smoothstep(size, size * 0.15, distSeg) * cool * flicker * uDebrisB.w;
      }
    }
  }

  float value = clamp(base * (1.0 - min(dim, 0.6)) + add + craterDelta, 0.0, 1.0);
  outColor = vec4(vec3(value), 1.0);
}
`}function td(e,t,a){let r=V(e,Q,ed(a.maxConcurrent,a.debrisCount)),n=e.getUniformLocation(r,"uField"),o=e.getUniformLocation(r,"uCssSize"),l=e.getUniformLocation(r,"uDetCount"),i=e.getUniformLocation(r,"uDetCenter[0]"),s=e.getUniformLocation(r,"uDetLife[0]"),u=e.getUniformLocation(r,"uRing"),f=e.getUniformLocation(r,"uFlash"),c=e.getUniformLocation(r,"uDebrisA"),m=e.getUniformLocation(r,"uDebrisB"),g=e.getUniformLocation(r,"uCrater"),b=e.getUniformLocation(r,"uCraterExtra");return{render(S,v,M){let y=M.config,x=M.state;Zf(x,y,M.timeSec),X(e,S),e.useProgram(r),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,v),e.uniform1i(n,0),e.uniform2f(o,Math.max(1,M.cssW),Math.max(1,M.cssH)),e.uniform1i(l,x.count),e.uniform2fv(i,x.centerData),e.uniform4fv(s,x.lifeData),e.uniform4f(u,y.ringReachPx,y.ringDurationMs/1e3,y.ringThicknessPx,y.ringRefractionPx),e.uniform4f(f,y.flashRadiusPx,y.flashBrightness,y.flashDurationMs/1e3,0),e.uniform4f(c,y.debrisSpeedPxPerSec,y.debrisSpeedVariation,y.debrisDrag,y.debrisGravityPxPerSec2),e.uniform4f(m,y.debrisLifetimeMs/1e3,y.debrisLifetimeVariation,y.debrisSizePx,y.debrisBrightness),e.uniform4f(g,y.craterRadiusPx,y.craterDepth,y.craterRelaxFastMs/1e3,y.craterRelaxSlowMs/1e3),e.uniform4f(b,y.craterLifeMs/1e3,y.craterRimStrength,0,0),t.draw()},dispose(){e.deleteProgram(r)}}}function ct(e){return e==="supernova"||e==="tidal"||e==="magma"}function ur(e,t,a){return Number.isFinite(e)?Math.min(a,Math.max(t,Math.round(e))):t}function $t(e,t){return{particleCount:ur(t.particleCount,0,32),crackCount:e==="magma"&&"crackCount"in t?ur(t.crackCount,1,12):1,maxConcurrent:"maxConcurrent"in t?ur(t.maxConcurrent,1,8):1}}function oo(e,t){let a=$t(e,t);return`${e}|${a.particleCount}|${a.crackCount}|${a.maxConcurrent}`}var cr=["intensity","fadeStart","fadeEnd","reachScale","widthScale","growthExponent","displacementScale","particleSizeScale","particleSpeedScale","particleGravityScale"],ad=["coreRadiusScale","coreBrightness","plasmaScale","turbulenceScale","rayStrength","swirlScale","shadeStrength"],rd=["foamStrength","causticStrength","curlScale","flowScale","flowSpeedScale","depthShade","routeIrregularity","crestStrength"],nd=["crackWidthScale","crackHeat","plateScale","channelWidthScale","crustStrength","swirlScale","coreBrightness","branchSpreadScale","churnScale","coreRadiusScale"];function wi(e,t){return e==="supernova"?[...cr,...ad,...t==="reveal"?["coronaRadiusScale","coronaBrightness"]:[]]:e==="tidal"?[...cr,...rd,...t==="reveal"?["thinningStart","thinningEnd"]:[]]:[...cr,...nd]}function Pi(e){return`u${e[0].toUpperCase()}${e.slice(1)}`}var od=`
const float PI = 3.14159265359;
const float TAU = 6.28318530718;
struct DuoEffect { vec2 offset; float light; float shade; float mask; };
DuoEffect cleanEffect() { return DuoEffect(vec2(0.0), 0.0, 0.0, 1.0); }
mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
float hash21(vec2 p) {
  p += uSeedOffset;
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float noise21(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1,0)), f.x),
    mix(hash21(i + vec2(0,1)), hash21(i + vec2(1,1)), f.x), f.y);
}
float fbm(vec2 p) {
  float n = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { n += noise21(p) * a; p = rot(0.5) * p * 2.03 + 13.1; a *= 0.5; }
  return n;
}
float segment(vec2 p, vec2 a, vec2 b, float w) {
  vec2 d = b - a;
  float h = clamp(dot(p - a, d) / max(dot(d,d), 0.000001), 0.0, 1.0);
  return 1.0 - smoothstep(w * 0.5, max(w, 0.0001), length(p - a - d * h));
}
`;function io(e){return`
float combustionDistance(vec2 p, vec2 a, vec2 b) {
  vec2 ab = b - a;
  float h = clamp(dot(p - a, ab) / max(dot(ab, ab), 0.000001), 0.0, 1.0);
  return length(p - a - ab * h);
}

vec2 combustionFragments(vec2 p, float t, float reach, float seed, float molten) {
  float life = smoothstep(0.0, 0.035, t) * (1.0 - smoothstep(0.36, 0.72, t));
  if (life <= 0.0) return vec2(0.0);
  vec2 fragments = vec2(0.0);
  for (int i = 0; i < ${e}; i++) {
    float id = float(i);
    float h = hash21(vec2(id + 2.7, seed));
    float k = hash21(vec2(seed + 13.1, id + 4.9));
    float angle = TAU * (id + h * 0.85) / ${Math.max(1,e)}.0;
    vec2 direction = vec2(cos(angle), sin(angle));
    vec2 velocity = direction * reach * mix(2.8, 4.5, k) * uReachScale * uParticleSpeedScale;
    vec2 gravity = vec2(0.0, reach * mix(0.04, 0.42, molten)) * uParticleGravityScale;
    vec2 head = velocity * t * (1.0 - 0.38 * t) + gravity * t * t;
    vec2 velocityNow = velocity * (1.0 - 0.76 * t) + gravity * 2.0 * t;
    vec2 tangent = dot(velocityNow, velocityNow) > 0.000000000001 ? normalize(velocityNow) : vec2(0.0);
    float size = reach * mix(0.006, 0.014, h) * life * uParticleSizeScale;
    float trail = reach * mix(0.065, 0.025, molten) * life * (0.3 + t) * uParticleSizeScale;
    float hot = segment(p, head - tangent * trail, head, size);
    float ember = segment(p, head - tangent * trail * 0.5, head, size * 2.6);
    fragments.x += hot * (0.7 + k * 0.3) + ember * 0.16;
    fragments.y += ember * molten * 0.22;
  }
  return fragments * life;
}
`}var id=`
DuoEffect duoReveal(vec2 p, float t) {
  DuoEffect e = cleanEffect();
  if (t >= 1.0) return e;
  e.mask = 0.0;
  if (t <= 0.0) return e;

  float reach = length(uAspect * 0.5);
  float r = length(p);
  vec2 direction = p / max(r, 0.00001);
  vec2 tangent = vec2(-direction.y, direction.x);
  float growth = pow(smoothstep(0.0, 0.9, t), uGrowthExponent);
  float radius = reach * 1.55 * growth * uReachScale;
  float cooling = smoothstep(0.24, 0.62, t);
  float energy = 1.0 - smoothstep(uFadeStart, uFadeEnd, t);
  float width = max(0.00001, min(radius * 0.82, reach * 0.25)
    * mix(1.0, 0.20, cooling) * uWidthScale);

  vec2 flow = p / reach * 7.5 - direction * radius / reach * 2.7;
  float roll = fbm(flow * 1.15 * uTurbulenceScale + vec2(-t * 4.2, t * 2.8));
  float turbulence = fbm(flow * 2.7 * uPlasmaScale + vec2(roll * 2.8, -t * 7.0));
  float angular = noise21(direction * 4.3 * uTurbulenceScale + vec2(7.1, 3.4));
  float wakeFront = r - radius - (angular - 0.5) * width * 0.7;
  float front = wakeFront - (roll - 0.47) * width * 0.5;

  e.mask = (1.0 - smoothstep(-width * 0.95, -width * 0.12, wakeFront))
    * smoothstep(0.075, 0.21, t);
  if (e.mask >= 1.0) return e;
  float unsettled = 1.0 - e.mask;
  float transition = e.mask * unsettled * 4.0;
  float body = smoothstep(-width * 0.96, -width * 0.5, front)
    * (1.0 - smoothstep(width * 0.48, width * 1.14, front));
  float pressure = exp(-pow((front - width * 0.03) / (width * 0.47), 2.0)) * body;
  float innerFire = exp(-pow((front + width * 0.38) / (width * 0.6), 2.0)) * body;
  float plasma = smoothstep(0.19, 0.74, turbulence + roll * 0.24);
  float filaments = pow(smoothstep(0.35, 0.77, turbulence), 2.0);

  vec2 rayFlow = direction * 22.7 + tangent * (r / reach * 1.7 - t * 2.1);
  float rayGrain = noise21(rayFlow + vec2(3.7, 11.2));
  float rayLength = noise21(direction * 9.3 + vec2(12.6, 7.1));
  float rays = pow(smoothstep(0.4, 0.83, rayGrain), 2.2)
    * smoothstep(-width * 0.4, width * 0.2, front)
    * (1.0 - smoothstep(width * 0.4, width * (1.2 + rayLength * 1.7), front));
  rays *= 0.4 + 0.6 * noise21(vec2(r / width * 4.0 - t * 19.0, rayLength * 17.0));

  float coreRadius = reach * 0.19 * (1.0 - exp(-t * 48.0)) * uCoreRadiusScale;
  float coreShape = r / max(coreRadius, 0.00001);
  float core = (1.0 - smoothstep(0.32, 1.0, coreShape))
    * (1.0 - smoothstep(0.075, 0.24, t));
  core *= 0.94 + 0.06 * noise21(p / max(coreRadius, 0.00001) * 6.0 - t * 12.0);
  float coronaRadius = reach * 0.58 * (1.0 - exp(-t * 32.0)) * uCoronaRadiusScale;
  float coronaDistance = r / max(coronaRadius, 0.00001);
  float corona = exp(-coronaDistance * coronaDistance * 3.4)
    * (1.0 - smoothstep(0.68, 1.0, coronaDistance))
    * (1.0 - smoothstep(0.10, 0.36, t));
  vec2 fragments = combustionFragments(p, t, reach, 27.3, 0.0);

  e.offset = (direction * (pressure * 0.085 + innerFire * plasma * 0.042 + core * 0.025)
    + tangent * (roll - 0.47) * body * 0.055 * uSwirlScale) * transition * energy;
  e.light = min(0.98, core * 0.93 * uCoreBrightness + corona * 0.72 * uCoronaBrightness + (body * (0.12 + plasma * 0.46)
    + pressure * 0.17 + innerFire * filaments * 0.21 + rays * 0.36 * uRayStrength + fragments.x * 0.86) * energy) * unsettled;
  e.shade = body * (1.0 - plasma) * 0.13 * unsettled * energy * uShadeStrength;
  return e;
}
`,ld=`
DuoEffect duoClick(vec2 p, vec2 center, float t, float seed) {
  DuoEffect e = cleanEffect();
  if (t <= 0.0 || t >= max(0.9, uFadeEnd)) return e;
  vec2 q = p - center;
  float r = length(q);
  vec2 direction = q / max(r, 0.00001);
  vec2 tangent = vec2(-direction.y, direction.x);
  float birth = 1.0 - exp(-t * 35.0);
  float life = 1.0 - smoothstep(uFadeStart, uFadeEnd, t);
  float radius = 0.38 * pow(t, uGrowthExponent) * uReachScale;
  float width = max(0.00001, min(radius * 0.74, 0.067) * uWidthScale);
  float roll = fbm(q * 27.0 * uTurbulenceScale - direction * t * 3.1 + vec2(seed, -t * 4.0));
  float front = r - radius - (roll - 0.47) * width * 0.7;
  float body = (1.0 - smoothstep(width * 0.24, width, abs(front))) * life;
  float plasma = noise21(q * 78.0 * uPlasmaScale - direction * t * 8.0 + seed);
  float coreRadius = max(0.000001, 0.092 * birth * uCoreRadiusScale);
  float core = (1.0 - smoothstep(coreRadius * 0.24, coreRadius, r))
    * (1.0 - smoothstep(0.08, 0.34, t));
  float rays = pow(smoothstep(0.38, 0.84, noise21(direction * 17.3 + seed)), 2.0)
    * smoothstep(-width * 0.3, width * 0.15, front)
    * (1.0 - smoothstep(width * 0.3, width * 2.3, front)) * life;
  vec2 fragments = combustionFragments(q, t, 0.14, seed, 0.0);

  e.offset = direction * (body * 0.054 + core * 0.024)
    + tangent * (roll - 0.47) * body * 0.025 * uSwirlScale;
  e.light = min(0.86, core * 0.8 * uCoreBrightness + body * (0.24 + plasma * 0.43)
    + rays * 0.24 * uRayStrength + fragments.x * 0.65);
  e.shade = body * (1.0 - plasma) * 0.12 * uShadeStrength;
  return e;
}
`,sd=`
float tidalRoute(vec2 p) {
  float r = length(p);
  vec2 direction = p / max(r, 0.00001);
  return r / (0.86 + 0.25 * fbm(direction * 3.7 + vec2(11.8, 7.3)) * uRouteIrregularity);
}

vec3 tidalSheet(vec2 p, vec2 direction, float depth, float t) {
  t *= uFlowSpeedScale;
  vec2 tangent = vec2(-direction.y, direction.x);
  vec2 flow = p * 12.0 * uFlowScale - direction * t * 8.5;
  flow += tangent * (sin(depth * 4.1 - t * 7.0) * 0.65) * uCurlScale;
  vec2 curl = (vec2(fbm(flow * 0.46 + vec2(t * 2.1, 4.3)),
    fbm(flow * 0.46 + vec2(9.2, -t * 1.8))) - 0.47) * uCurlScale;
  flow += curl * 4.8;
  float water = noise21(flow * 1.15 + vec2(0.0, -t * 6.0));
  float crossing = sin(flow.x * 2.2 + sin(flow.y * 1.8))
    + sin(flow.y * 2.7 + curl.x * 7.0 - t * 4.0);
  float caustic = pow(max(0.0, 1.0 - abs(crossing) * 0.58), 7.0);
  float roll = 0.5 + 0.5 * sin(depth * 6.5 + curl.y * 9.0 + water * 3.0 - t * 8.0);
  float aeration = smoothstep(0.43, 0.74, water + curl.y * 0.6);
  float foam = aeration * pow(roll, 3.0)
    * (1.0 - smoothstep(0.28, 0.77, depth));
  float crest = pow(roll, 2.0) * (0.4 + aeration * 0.6);
  float light = 0.17 + water * 0.21 + caustic * 0.34 * uCausticStrength
    + foam * 0.46 * uFoamStrength + crest * 0.25 * uCrestStrength;
  float underside = (1.0 - roll) * (0.12 + water * 0.12) * uDepthShade;
  return vec3(light, underside, curl.x + curl.y);
}
`;function ud(e){return`
DuoEffect duoReveal(vec2 p, float t) {
  DuoEffect e = cleanEffect();
  if (t <= 0.0) { e.mask = 0.0; return e; }
  float r = length(p);
  vec2 direction = p / max(r, 0.00001);
  vec2 tangent = vec2(-direction.y, direction.x);
  float travelTime = t + 0.08 * smoothstep(0.24, 0.64, t);
  float travel = pow(clamp(travelTime / 0.86, 0.0, 1.0), uGrowthExponent);
  float reach = length(uAspect) * 0.5 / 0.86 + 0.34;
  float radius = reach * travel * uReachScale;
  float thinning = smoothstep(uThinningStart, uThinningEnd, t);
  float energy = 1.0 - smoothstep(uFadeStart, uFadeEnd, t);
  float width = min(radius * 0.96, 0.31 + 0.09 * sin(PI * travel))
    * mix(1.0, 0.20, thinning) * uWidthScale;
  float depth = (radius - tidalRoute(p)) / max(width, 0.00001);
  e.mask = smoothstep(0.32, 0.94, depth);
  if (e.mask >= 1.0) return e;
  float sheet = smoothstep(-0.30, 0.07, depth)
    * (1.0 - smoothstep(0.50, 0.94, depth)) * energy;
  if (sheet > 0.0) {
    vec3 water = tidalSheet(p, direction, depth, t);
    float partial = 4.0 * e.mask * (1.0 - e.mask);
    e.offset = (direction * (0.021 + water.z * 0.032)
      + tangent * water.z * 0.039) * sheet * partial;
    e.light = water.x * sheet;
    e.shade = water.y * sheet;
  }
  float sprayLife = (1.0 - smoothstep(0.42, 0.79, t)) * energy;
  if (sprayLife > 0.0) {
    for (int i = 0; i < ${e}; i++) {
      float f = float(i);
      float h = hash21(vec2(f + 31.7, 19.2));
      float angle = f * 2.399963 + h * 0.6;
      vec2 ray = vec2(cos(angle), sin(angle));
      vec2 side = vec2(-ray.y, ray.x);
      float flight = reach * pow(clamp(t / 0.76, 0.0, 1.0), 0.72) * uReachScale * uParticleSpeedScale;
      vec2 drop = ray * flight * (0.88 + h * 0.28)
        + side * flight * flight * (h - 0.5) * 0.09;
      drop.y += t * t * 0.14 * uParticleGravityScale;
      float size = min(flight * 0.06, 0.008 + h * 0.010)
        * (1.0 - smoothstep(0.24, 0.79, t)) * sqrt(energy) * uParticleSizeScale;
      vec2 local = p - drop;
      vec2 lens = vec2(dot(local, ray) / (1.8 - t), dot(local, side));
      float bead = 1.0 - smoothstep(size * 0.32, max(size, 0.000001), length(lens));
      float glint = 1.0 - smoothstep(size * 0.12, max(size * 0.56, 0.000001),
        length(lens + vec2(size * 0.18, size * 0.20)));
      e.light = max(e.light, (bead * 0.27 + glint * 0.35) * sprayLife);
    }
  }
  return e;
}
`}function cd(e){return`
DuoEffect duoClick(vec2 p, vec2 center, float t, float seed) {
  DuoEffect e = cleanEffect();
  if (t <= 0.0 || t >= max(0.90, uFadeEnd)) return e;
  vec2 q = p - center;
  float r = length(q);
  vec2 direction = q / max(r, 0.00001);
  vec2 tangent = vec2(-direction.y, direction.x);
  float impact = 1.0 - pow(1.0 - clamp(t / 0.85, 0.0, 1.0), uGrowthExponent);
  float radius = impact * 0.30 * uReachScale;
  float width = min(radius * 0.88, 0.11) * (1.0 - t * 0.35) * uWidthScale;
  float route = r / (0.86 + noise21(direction * 3.1 + seed) * 0.28 * uRouteIrregularity);
  float depth = (radius - route) / max(width, 0.00001);
  float life = smoothstep(0.0, 0.035, t) * (1.0 - smoothstep(uFadeStart, uFadeEnd, t));
  float body = smoothstep(-0.28, 0.04, depth)
    * (1.0 - smoothstep(0.40, 0.97, depth));
  vec3 water = tidalSheet(q * 1.7, direction, depth, t + seed * 0.07);
  e.offset = (direction * (0.034 + water.z * 0.016)
    + tangent * water.z * 0.025) * body * life;
  e.light = water.x * body * life;
  e.shade = water.y * body * life;
  for (int i = 0; i < ${e}; i++) {
    float f = float(i);
    float h = hash21(vec2(f + 6.2, seed + 3.1));
    float angle = f * 2.399963 + seed * 0.41 + h * 0.55;
    vec2 ray = vec2(cos(angle), sin(angle));
    vec2 side = vec2(-ray.y, ray.x);
    vec2 drop = ray * impact * (0.27 + h * 0.19) * uReachScale * uParticleSpeedScale
      + vec2(0.0, t * t * 0.075 * uParticleGravityScale);
    float size = min(impact * 0.075, 0.009 + h * 0.012)
      * (1.0 - smoothstep(0.24, 0.86, t)) * uParticleSizeScale;
    vec2 local = q - drop;
    vec2 lens = vec2(dot(local, ray) / (1.7 - t * 0.5), dot(local, side));
    float bead = 1.0 - smoothstep(size * 0.30, max(size, 0.000001), length(lens));
    float dropLife = life * (1.0 - smoothstep(0.62, 0.86, t));
    e.offset -= ray * bead * dropLife * 0.019;
    e.light = max(e.light, bead * dropLife * (0.38 + h * 0.22));
    e.shade += bead * dropLife * 0.025 * uDepthShade;
  }
  return e;
}
`}function fd(e){return`
vec3 magmaNetwork(vec2 p) {
  vec3 distanceToCrack = vec3(4.0);
  for (int i = 0; i < ${e}; i++) {
    float id = float(i);
    float h = hash21(vec2(id + 1.4, 13.2));
    float k = hash21(vec2(id + 9.7, 25.8));
    float angle = TAU * (id + 0.76 * h) / ${e}.0;
    vec2 direction = vec2(cos(angle), sin(angle));
    vec2 a = rot((h - 0.5) * 0.38 * uBranchSpreadScale) * direction * 0.18;
    vec2 b = rot((k - 0.5) * 0.49 * uBranchSpreadScale) * direction * 0.57;
    vec2 c = rot((h - 0.5) * 0.22 * uBranchSpreadScale) * direction * 1.65;
    float trunk = min(combustionDistance(p, vec2(0.0), a), combustionDistance(p, a, b));
    trunk = min(trunk, combustionDistance(p, b, c));

    float side = mix(-1.0, 1.0, step(0.5, h));
    vec2 fork = a + rot(side * (0.45 + k * 0.32) * uBranchSpreadScale) * direction * 0.34;
    vec2 forkEnd = fork + rot(side * (0.16 + h * 0.3) * uBranchSpreadScale) * direction * 0.68;
    vec2 outerFork = b + rot(-side * (0.38 + h * 0.24) * uBranchSpreadScale) * direction * 0.83;
    float branch = min(combustionDistance(p, a, fork), combustionDistance(p, fork, forkEnd));
    branch = min(branch, combustionDistance(p, b, outerFork));

    vec2 root = mix(a, fork, 0.56);
    vec2 split = root + rot(-side * (0.5 + k * 0.3) * uBranchSpreadScale) * direction * 0.19;
    float detail = combustionDistance(p, root, split);
    detail = min(detail, combustionDistance(p, split, split + direction * 0.25));
    distanceToCrack = min(distanceToCrack, vec3(trunk, branch, detail));
  }
  return distanceToCrack;
}

vec2 magmaPlates(vec2 p) {
  vec2 cell = floor(p);
  vec2 local = fract(p);
  float first = 5.0;
  float second = 5.0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 neighbor = vec2(float(x), float(y));
      vec2 id = cell + neighbor;
      vec2 point = 0.2 + 0.6 * vec2(hash21(id + 3.1), hash21(id + 19.8));
      float distanceToCell = length(neighbor + point - local);
      if (distanceToCell < first) {
        second = first;
        first = distanceToCell;
      } else {
        second = min(second, distanceToCell);
      }
    }
  }
  return vec2(second - first, first);
}
`}var dd=`
DuoEffect duoReveal(vec2 p, float t) {
  DuoEffect e = cleanEffect();
  if (t >= 1.0) return e;
  e.mask = 0.0;
  if (t <= 0.0) return e;

  float reach = length(uAspect * 0.5);
  float r = length(p);
  vec2 direction = p / max(r, 0.00001);
  vec2 tangent = vec2(-direction.y, direction.x);
  vec3 cracks = magmaNetwork(p / reach) * reach;
  float nearestCrack = min(cracks.x, min(cracks.y, cracks.z));
  float radius = reach * 1.98 * pow(smoothstep(0.0, 0.9, t), uGrowthExponent) * uReachScale;
  float cooling = smoothstep(0.24, 0.64, t);
  float energy = 1.0 - smoothstep(uFadeStart, uFadeEnd, t);
  float width = max(0.00001, min(radius * 0.72, reach * 0.29)
    * mix(1.0, 0.20, cooling) * uWidthScale);
  float front = r + nearestCrack * 0.78 - radius;

  e.mask = (1.0 - smoothstep(-width * 0.85, -width * 0.08, front))
    * smoothstep(0.04, 0.105, t);
  if (e.mask >= 1.0) return e;
  float unsettled = 1.0 - e.mask;
  float transition = e.mask * unsettled * 4.0;
  float body = smoothstep(-width * 0.87, -width * 0.45, front)
    * (1.0 - smoothstep(width * 0.45, width * 1.05, front));
  float crackReach = radius + width * 1.65;
  float crackTip = 1.0 - smoothstep(crackReach - width * 0.45, crackReach, r);
  float crackBirth = max(0.000001, 1.0 - exp(-t * 40.0));
  float trunk = 1.0 - smoothstep(reach * 0.004 * crackBirth * uCrackWidthScale, reach * 0.013 * crackBirth * uCrackWidthScale, cracks.x);
  float branches = 1.0 - smoothstep(reach * 0.002 * crackBirth * uCrackWidthScale, reach * 0.007 * crackBirth * uCrackWidthScale, cracks.y);
  float detail = 1.0 - smoothstep(reach * 0.001 * crackBirth * uCrackWidthScale, reach * 0.0035 * crackBirth * uCrackWidthScale, cracks.z);
  float crackHeat = max(trunk, max(branches * 0.77, detail * 0.48)) * crackTip;

  vec2 flow = p / reach * 10.5 - direction * radius / reach * 1.8;
  float churn = fbm(flow * 0.78 * uChurnScale + vec2(t * 1.6, -t * 2.8));
  vec2 warp = vec2(noise21(flow * 1.7 + t * 2.3), noise21(flow * 1.4 - t * 3.2));
  vec2 plates = magmaPlates((flow + warp * 1.35) * uPlateScale);
  float channels = 1.0 - smoothstep(0.035 * uChannelWidthScale, 0.19 * uChannelWidthScale, plates.x);
  float crust = smoothstep(0.08, 0.34, plates.x);
  float lava = smoothstep(0.24, 0.72, churn + channels * 0.21);
  float broadVein = 1.0 - smoothstep(reach * 0.01 * uCrackWidthScale, reach * 0.06 * uCrackWidthScale, nearestCrack);
  float molten = body * (0.1 + lava * 0.28 + channels * 0.38 + broadVein * 0.22);

  float coreRadius = max(0.000001, reach * 0.15 * (1.0 - exp(-t * 38.0)) * uCoreRadiusScale);
  float furnace = (1.0 - smoothstep(coreRadius * 0.4, coreRadius, r))
    * (1.0 - smoothstep(0.065, 0.21, t));
  vec2 fragments = combustionFragments(p, t, reach * 0.77, 52.8, 1.0);

  e.offset = (direction * (body * (0.02 + lava * 0.029) + furnace * 0.018)
    + tangent * (churn - 0.47) * body * 0.067 * uSwirlScale) * transition * energy;
  e.light = min(0.91, furnace * 0.81 * uCoreBrightness + molten + crackHeat * 0.71 * uCrackHeat + fragments.x * 0.78) * unsettled * energy;
  e.shade = (body * crust * 0.23 * uCrustStrength + fragments.y) * unsettled * energy;
  return e;
}
`,hd=`
DuoEffect duoClick(vec2 p, vec2 center, float t, float seed) {
  DuoEffect e = cleanEffect();
  if (t <= 0.0 || t >= max(0.94, uFadeEnd)) return e;
  vec2 q = rot(seed) * (p - center);
  float r = length(q);
  vec2 direction = q / max(r, 0.00001);
  vec2 tangent = vec2(-direction.y, direction.x);
  vec3 cracks = magmaNetwork(q / 0.31) * 0.31;
  float nearestCrack = min(cracks.x, min(cracks.y, cracks.z));
  float birth = max(0.000001, 1.0 - exp(-t * 34.0));
  float life = 1.0 - smoothstep(uFadeStart, uFadeEnd, t);
  float radius = 0.35 * pow(t, uGrowthExponent) * uReachScale;
  float width = max(0.00001, min(radius * 0.8, 0.061) * uWidthScale);
  float front = r + nearestCrack * 0.78 - radius;
  float body = (1.0 - smoothstep(width * 0.22, width, abs(front))) * life;
  float churn = fbm(q * 33.0 * uChurnScale - direction * t * 3.8 + seed);
  vec2 plates = magmaPlates((q * 56.0 - direction * t * 5.0 + churn) * uPlateScale);
  float channels = 1.0 - smoothstep(0.025 * uChannelWidthScale, 0.18 * uChannelWidthScale, plates.x);
  float split = 1.0 - smoothstep(0.0008 * birth * uCrackWidthScale, 0.004 * birth * uCrackWidthScale, nearestCrack);
  split *= (1.0 - smoothstep(radius + width * 0.2, radius + width * 1.9, r)) * life;
  float coreRadius = max(0.000001, 0.069 * birth * uCoreRadiusScale);
  float core = (1.0 - smoothstep(coreRadius * 0.2, coreRadius, r))
    * (1.0 - smoothstep(0.11, 0.39, t));
  vec2 fragments = combustionFragments(p - center, t, 0.097, seed + 7.2, 1.0);

  e.offset = rot(-seed) * (direction * (body * 0.032 + core * 0.022)
    + tangent * (churn - 0.47) * body * 0.039 * uSwirlScale);
  e.light = min(0.84, core * 0.65 * uCoreBrightness + body * (0.13 + channels * 0.47 + churn * 0.15)
    + split * 0.54 * uCrackHeat + fragments.x * 0.68);
  e.shade = body * (1.0 - channels) * 0.24 * uCrustStrength + fragments.y;
  return e;
}
`;function pd(e,t,a){let r=t==="reveal",n=e==="supernova"?io(a.particleCount)+(r?id:ld):e==="magma"?io(a.particleCount)+fd(a.crackCount)+(r?dd:hd):sd+(r?ud(a.particleCount):cd(a.particleCount));return`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uField;
uniform vec2 uAspect;
uniform float uProgress;
uniform float uSeedOffset;
${wi(e,t).map(o=>`uniform float ${Pi(o)};`).join(`
`)}
${r?"":`uniform int uCount;
uniform vec4 uEvents[${a.maxConcurrent}];`}
${od}
${n}
void main() {
  vec2 p = (vec2(vUv.x, 1.0 - vUv.y) - 0.5) * uAspect;
  ${r?`
  if (uProgress >= 1.0) { outColor = texture(uField, vUv); return; }
  DuoEffect effect = duoReveal(p, clamp(uProgress, 0.0, 1.0));
  `:`
  if (uCount == 0) { outColor = texture(uField, vUv); return; }
  DuoEffect effect = cleanEffect();
  for (int i = 0; i < ${a.maxConcurrent}; i++) {
    if (i >= uCount) break;
    vec4 event = uEvents[i];
    DuoEffect hit = duoClick(p, (event.xy - 0.5) * uAspect, clamp(event.z, 0.0, 1.0), event.w);
    effect.offset += hit.offset;
    effect.light += hit.light;
    effect.shade += hit.shade;
  }
  `}
  vec2 delta = effect.offset * uIntensity * uDisplacementScale / uAspect;
  vec2 uv = clamp(vUv + vec2(delta.x, -delta.y), vec2(0.001), vec2(0.999));
  float field = texture(uField, uv).r;
  float value = clamp(field * effect.mask + (effect.light - effect.shade) * uIntensity, 0.0, 1.0);
  outColor = vec4(vec3(value), 1.0);
}
`}function lo(e,t,a,r,n){let o=V(e,Q,pd(a,r,n)),l=e.getUniformLocation(o,"uField"),i=e.getUniformLocation(o,"uAspect"),s=e.getUniformLocation(o,"uProgress"),u=e.getUniformLocation(o,"uSeedOffset"),f=r==="click"?e.getUniformLocation(o,"uCount"):null,c=r==="click"?e.getUniformLocation(o,"uEvents[0]"):null,m=wi(a,r).map(S=>({field:S,location:e.getUniformLocation(o,Pi(S))})),g=-1,b=0;return{render(S,v,M){let y=M.config;g!==M.config.seed&&(g=M.config.seed,b=r==="reveal"&&g!==81027?1+Rt(g)()*90:0),X(e,S),e.useProgram(o),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,v),e.uniform1i(l,0);let x=Math.max(1,M.cssW),T=Math.max(1,M.cssH),R=Math.min(x,T);e.uniform2f(i,x/R,T/R),e.uniform1f(s,M.progress??1),e.uniform1f(u,b);for(let C of m)e.uniform1f(C.location,y[C.field]);r==="click"&&(e.uniform1i(f,Math.min(n.maxConcurrent,M.count??0)),M.events&&e.uniform4fv(c,M.events)),t.draw()},dispose(){e.deleteProgram(o)}}}function md(e,t){let a=$t(e,t).maxConcurrent;return{type:e,seed:t.seed,capacity:a,count:0,events:Array.from({length:8},()=>({x:0,y:0,startMs:null,seed:0})),packed:new Float32Array(a*4),rng:Rt(t.seed)}}function Ci(e){let t=e.events[0];for(let a=1;a<e.count;a++)e.events[a-1]=e.events[a];e.events[--e.count]=t}function gd(e,t,a){if(!e||e.type!==t||e.seed!==a.seed)return md(t,a);let r=$t(t,a).maxConcurrent;if(r!==e.capacity){for(;e.count>r;)Ci(e);e.capacity=r,e.packed=new Float32Array(r*4)}return e}function vd(e){e.count=0,e.packed.fill(0)}function xd(e,t,a){if(!Number.isFinite(t)||!Number.isFinite(a))return;e.count>=e.capacity&&Ci(e);let r=e.events[e.count++];r.x=t,r.y=a,r.startMs=null,r.seed=1+e.rng()*90}function bd(e,t,a){let r=0;e.packed.fill(0);for(let n=0;n<e.count;n++){let o=e.events[n];o.startMs??=t;let l=Math.max(0,(t-o.startMs)/Math.max(1,a));if(l>=1)continue;e.events[n]=e.events[r],e.events[r]=o;let i=r*4;e.packed[i]=o.x,e.packed[i+1]=o.y,e.packed[i+2]=l,e.packed[i+3]=o.seed,r++}return e.count=r,r}var Sd=16.67;function yt(e,t){let a=Math.sin(e*12.9898+t*78.233)*43758.5453;return a-Math.floor(a)}function yd(e,t){let a=Math.hypot(e.vx,e.vy),r=a>0?-e.vx/a*t.pushLagPx:0,n=a>0?-e.vy/a*t.pushLagPx:0,o=Math.cos(e.seed*1.37+e.ageMs*.01)*t.pushWobblePx,l=Math.sin(e.seed*1.91+e.ageMs*.012)*t.pushWobblePx;return{x:e.x+r+o,y:e.y+n+l}}function Md(e,t,a,r,n){let o=e.nextSeed++,l=yt(o,1)*Math.PI*2,i=n.spreadMinPx+yt(o,2)*(n.spreadMaxPx-n.spreadMinPx),s=r>0?{x:-a.y/r,y:a.x/r}:{x:0,y:0},u=yt(o,3)*2-1;return{x:t.x+Math.cos(l)*i,y:t.y+Math.sin(l)*i,vx:a.x*n.particleVelocityScale+s.x*u*n.particleTangentVelocity,vy:a.y*n.particleVelocityScale+s.y*u*n.particleTangentVelocity,ageMs:0,lifeMs:n.particleLifeMs+yt(o,4)*n.particleLifeJitterMs,radius:n.particleRadius*(.75+yt(o,5)*.8),spin:(yt(o,6)*2-1)*n.spinStrength,seed:o}}function fr(){return{current:{x:0,y:0},velocity:{x:0,y:0},target:null,drops:[],hasPointer:!1,clearFramesRemaining:0,emitRemainder:0,lastEmit:null,nextSeed:1}}function so(e,t){if(e.target=t,!t){e.hasPointer=!1;return}e.hasPointer||(e.current={...t},e.velocity={x:0,y:0},e.lastEmit={...t}),e.hasPointer=!0}function wd(e,t,a=se){let r=Qo(a),n=Math.max(0,Math.min(48,t||16.67)),o=e.drops.length>0,l=n/Sd;if(!r.enabled){e.drops=[],e.emitRemainder=0,o&&(e.clearFramesRemaining=10);let c=e.clearFramesRemaining>0;return c&&e.clearFramesRemaining--,{samples:[],changed:c}}if(e.target){let c=e.current;e.current={...e.target};let m={x:(e.current.x-c.x)/l,y:(e.current.y-c.y)/l},g=r.emitterVelocitySmoothing**+l;e.velocity={x:e.velocity.x*g+m.x*(1-g),y:e.velocity.y*g+m.y*(1-g)};let b=Math.hypot(e.velocity.x,e.velocity.y),S=e.lastEmit??e.current,v=Math.hypot(e.current.x-S.x,e.current.y-S.y)/r.particleSpacingPx+l+e.emitRemainder,M=Math.min(Math.max(1,Math.round(r.maxEmitPerTick*l)),Math.floor(v));e.emitRemainder=v%1;for(let y=0;y<M;y++){let x=M<=1?1:y/(M-1),T={x:S.x+(e.current.x-S.x)*x,y:S.y+(e.current.y-S.y)*x};e.drops.push(Md(e,T,e.velocity,b,r))}e.lastEmit={...e.current}}let i=r.particleDamping**+l,s=[],u=[];for(let c of e.drops){let m=c.ageMs+n;if(m>=c.lifeMs)continue;let g=1-m/c.lifeMs,b=Math.sin(c.x*.017+c.y*.013+c.seed)*c.spin*l,S=(c.vx-c.vy*b)*i,v=(c.vy+c.vx*b)*i,M={...c,ageMs:m,vx:S,vy:v,x:c.x+S*l,y:c.y+v*l},y=yd(M,r);u.push(M),s.push({x:M.x,y:M.y,pushX:y.x,pushY:y.y,radius:M.radius*(r.densityRadiusMinScale+g*r.densityRadiusLifeScale),alpha:r.particleAlpha*g*g,progress:1-g,seed:c.seed})}e.drops=u,o&&u.length===0&&(e.clearFramesRemaining=10);let f=s.length===0&&e.clearFramesRemaining>0;return f&&e.clearFramesRemaining--,{samples:s,changed:s.length>0||f}}var Pd=.01;function Cd(e){let t=0;return{report(a){Math.abs(a-t)<=Pd||(t=a,e?.(a))},settle(){t!==0&&(t=0,e?.(0))}}}var Td=30,Rd=1/Td,Ma=.1;function Tr(e=450){let t=Math.round(Ma*e),a=0;return{take(r){if(!(r>0))return 0;a+=Math.min(r,Ma)*e;let n=Math.min(Math.floor(a+1e-6),t);return n<=0?0:(a=Math.max(0,a-n),n)}}}var Ed=.12,Ad=400,kd=.45;function Dd(){let e=Tr(),t=!1,a=0,r=0,n=0,o=-1/0,l=0,i=0;return{advance(s,u,f){let c=e.take(u),m=0,g=0,b=0,S=0,v=0;if(f){S=f.x,v=f.y,t||=(a=S,r=v,n=0,!0),g=a,b=r,n+=u;let M=n>0?Math.hypot(S-g,v-b)/n*Rd:0;m=Math.min(1,M*Ed),c>0&&(a=S,r=v,n=0)}else{t&&(o=s,l=a,i=r),t=!1,n=0;let M=(s-o)/Ad;if(M>=0&&M<1){let y=1-M;m=kd*y*y,g=S=l,b=v=i}}return{substeps:c,ax:g,ay:b,bx:S,by:v,amp:m}}}}function Rr(e,t,a,r={}){let n=rt(e,t,a,r),o=rt(e,t,a,r);return{read:()=>n,write:()=>o,swap:()=>{let l=n;n=o,o=l},resize:(l,i)=>{ba(e,n,l,i),ba(e,o,l,i)},dispose:()=>{Ye(e,n),Ye(e,o)}}}var Fd=`#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uPrev;      // rg = height, velocity
uniform vec2 uTexel;          // 1/simW, 1/simH
uniform vec2 uSplatA;         // segment start, sim pixels
uniform vec2 uSplatB;         // segment end, sim pixels
uniform float uSplatAmp;
uniform float uSplatRadius;
out vec4 outColor;

// Spring-coupled heightfield. CLAMP_TO_EDGE sampling makes the borders
// reflect softly, so waves bounce off the canvas walls.
void main() {
  vec2 hv = texture(uPrev, vUv).rg;
  float hL = texture(uPrev, vUv - vec2(uTexel.x, 0.0)).r;
  float hR = texture(uPrev, vUv + vec2(uTexel.x, 0.0)).r;
  float hT = texture(uPrev, vUv + vec2(0.0, uTexel.y)).r;
  float hB = texture(uPrev, vUv - vec2(0.0, uTexel.y)).r;
  float lap = (hL + hR + hT + hB) * 0.25 - hv.r;

  // Value noise breaks the stiffness up so wavefronts stay irregular
  // instead of collapsing into perfect circles.
  vec2 np = vUv / uTexel * 0.02;
  vec2 ni = floor(np);
  vec2 nf = fract(np);
  float n00 = fract(sin(dot(ni, vec2(127.1, 311.7))) * 43758.5453);
  float n10 = fract(sin(dot(ni + vec2(1.0, 0.0), vec2(127.1, 311.7))) * 43758.5453);
  float n01 = fract(sin(dot(ni + vec2(0.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
  float n11 = fract(sin(dot(ni + vec2(1.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
  vec2 sf = nf * nf * (3.0 - 2.0 * nf);
  float wn = mix(mix(n00, n10, sf.x), mix(n01, n11, sf.x), sf.y);

  float vel = (hv.g + lap * (0.45 * (0.80 + 0.30 * wn))) * 0.98555;
  float h = (hv.r + vel) * 0.9956;
  h = mix(h, (hL + hR + hT + hB) * 0.25, 0.06); // viscosity

  if (uSplatAmp != 0.0) {
    vec2 pos = vUv / uTexel;
    vec2 ba = uSplatB - uSplatA;
    float bl = length(ba);
    float rr = uSplatRadius;
    if (bl > 0.5) {
      // Swept segment: a capsule crest anchored on the cursor path, with a
      // weaker trailing lobe behind it so the stroke reads as a dipole wake.
      vec2 nd = ba / bl;
      vec2 offs = nd * rr * 1.4;
      float angS = atan(pos.y - uSplatA.y, pos.x - uSplatA.x);
      float wobS = 1.0 + 0.24 * sin(angS * 3.0 + wn * 6.2831);
      vec2 paF = pos - uSplatA;
      float ttF = clamp(dot(paF, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
      vec2 dpF = paF - ba * ttF;
      vec2 paB = pos - (uSplatA - offs);
      float ttB = clamp(dot(paB, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
      vec2 dpB = paB - ba * ttB;
      h += uSplatAmp * (exp(-dot(dpF, dpF) / (2.0 * rr * rr * wobS))
                       - 0.45 * exp(-dot(dpB, dpB) / (2.0 * rr * rr * wobS)));
    } else {
      vec2 dp = pos - uSplatA;
      float ang = atan(dp.y, dp.x);
      float wob = 1.0 + 0.30 * sin(ang * 3.0 + wn * 6.2831) + 0.18 * sin(ang * 5.0 - wn * 4.0);
      h += uSplatAmp * exp(-dot(dp, dp) / (2.0 * rr * rr * wob));
    }
  }

  outColor = vec4(h, vel, 0.0, 1.0);
}
`;function Ti(e,t){let a=V(e,Q,Fd),r=o=>e.getUniformLocation(a,o),n={prev:r("uPrev"),texel:r("uTexel"),splatA:r("uSplatA"),splatB:r("uSplatB"),amp:r("uSplatAmp"),radius:r("uSplatRadius")};return{render(o,l,i){X(e,o),e.useProgram(a),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,l.texture),e.uniform1i(n.prev,0),e.uniform2f(n.texel,i.texelX,i.texelY),e.uniform2f(n.splatA,i.ax,i.ay),e.uniform2f(n.splatB,i.bx,i.by),e.uniform1f(n.amp,i.amp),e.uniform1f(n.radius,i.radius),t.draw(),e.bindFramebuffer(e.FRAMEBUFFER,null)},dispose(){e.deleteProgram(a)}}}var uo=2,co=420,Ld=7,Ud=.5,Bd=6e3,Id=1.65,_d=.5;function Wd(e,t){let a=Ti(e,t),r=Dd(),n=null,o=0,l=0,i=null,s=!1,u=-1/0,f=0,c=-1;function m(){if(n){for(let b of[n.read(),n.write()])X(e,b),e.clearColor(0,0,0,1),e.clear(e.COLOR_BUFFER_BIT);e.bindFramebuffer(e.FRAMEBUFFER,null)}}function g(b,S,v,M){let{ax:y,ay:x,bx:T,by:R,amp:C,substeps:w}=S;if(s){i=null;return}if(C!==0&&(u=b),b-u>Bd){i=null;return}let p=Math.max(1,Math.round(v/uo)),E=Math.max(1,Math.round(M/uo)),D=Math.max(p,E);if(D>co){let L=co/D;p=Math.max(1,Math.round(p*L)),E=Math.max(1,Math.round(E*L))}try{if(n)(p!==o||E!==l)&&(n.resize(p,E),o=p,l=E,m());else{if(!e.getExtension("EXT_color_buffer_float"))throw Error("EXT_color_buffer_float unavailable");n=Rr(e,p,E,{float:!0,linear:!0}),o=p,l=E,m()}let L=C===0?0:y/Math.max(1,v)*p,H=C===0?0:(M-x)/Math.max(1,M)*E,U=C===0?0:T/Math.max(1,v)*p,A=C===0?0:(M-R)/Math.max(1,M)*E;for(let ee=0;ee<w;ee++){let Se=ee/w,we=(ee+1)/w;a.render(n.write(),n.read(),{texelX:1/p,texelY:1/E,ax:L+(U-L)*Se,ay:H+(A-H)*Se,bx:L+(U-L)*we,by:H+(A-H)*we,amp:C*Ud,radius:Ld}),n.swap()}i=n.read().texture}catch(L){s=!0,i=null,console.warn("[stripes-engine] water sim disabled:",L)}}return{tick(b,S,v,M){let y=c<0?0:Math.max(0,Math.min(Ma,(b-c)/1e3));c=b;let x=r.advance(b,y,S),T=x.amp===0?0:Math.min(1,Math.abs(x.amp)*3.2);f+=(T-f)*(1-Math.exp(-y/_d)),g(b,x,v,M)},current(){return!i||o===0||l===0?null:{texture:i,gain:Id,texelX:1/o,texelY:1/l}},resetActivity(){f=0},activity(){return f},dispose(){a.dispose(),n?.dispose(),n=null,i=null}}}var Gd=1.35,fo=.35,ho=.45,Od=600,zd=700,Hd=250,Vd=3,Nd=.2,Xd=1.618;function Er(e){let t=Math.min(1,Math.max(0,e));return t*t*(3-2*t)}function qd(e,t){if(t<=0)return 0;let a=Math.min(Od,t*.25);return Er((t-e)/a)}function Ri(e,t){return t.segCount*t.segSpacingPx/Math.max(1,e)*1e3}function jd(e,t){if(e.hidden)return 0;let a=Er((t-e.shownAtMs)/Hd),r=Er((e.phaseEndMs-t)/zd);return Math.min(a,r)}function $d(e,t,a){let r=Math.sin(t*e.turnFreq1+e.turnPhase1)+.6*Math.sin(t*e.turnFreq2+e.turnPhase2);return a.turnRate*e.turnDir*(1+a.turnVariation*r)}function Yd(e,t,a,r){if(r<=0)return 0;let n=Math.min(e.x,e.y,t-e.x,a-e.y);if(n>=r)return 0;let o=Math.min(1,(r-n)/r),l=Math.atan2(a*.5-e.y,t*.5-e.x),i=Math.atan2(Math.sin(l-e.heading),Math.cos(l-e.heading));return o*o*Vd*i}function dr(e,t,a,r,n){let o=t.vortexSingular,l=t.baseSpeedPxPerSec*.5*t.speedVariation,i=be(Math.max(1,t.baseSpeedPxPerSec-l),t.baseSpeedPxPerSec+l,e()),s=be(o.lifeMinMs,o.lifeMaxMs,e()),u=Ri(i,o),f=be(o.visibleMinMs,o.visibleMaxMs,e()),c=e()*a.width,m=e()*a.height;return{x:c,y:m,heading:e()*Math.PI*2,speedPxPerSec:i,thickness:Math.max(1,be(t.minWidthRatio,t.maxWidthRatio,e())*a.width),turnDir:e()<.5?-1:1,turnFreq1:be(.15,.4,e()),turnFreq2:be(.15,.4,e())*Xd,turnPhase1:e()*Math.PI*2,turnPhase2:e()*Math.PI*2,bornMs:n?r-e()*s*.8:r,lifeMs:s,baseOpacity:be(t.opacityMin,t.opacityMax,e()),colorSeed:e(),hidden:!1,phaseEndMs:r+(n?e()*(u+f):u+f),shownAtMs:r,trailX:[c],trailY:[m]}}function Kd(e,t){let a=t.segCount*t.segSpacingPx*1.25+40,r=e.trailX,n=e.trailY,o=0;for(let l=r.length-1;l>0;l--)if(o+=Math.hypot(r[l]-r[l-1],n[l]-n[l-1]),o>a){l>1&&(r.splice(0,l-1),n.splice(0,l-1));return}}function Jd(e,t,a,r){let n=t.trailX,o=t.trailY,l=a.segSpacingPx*Gd,i=0,s=0;for(let u=n.length-1;u>0&&i<a.segCount;u--){let f=n[u],c=o[u],m=n[u-1],g=o[u-1],b=Math.hypot(m-f,g-c);if(b<=0)continue;let S=Math.atan2(c-g,f-m);for(;i<a.segCount&&i*a.segSpacingPx<=s+b;){let v=(i*a.segSpacingPx-s)/b,M=1-i/a.segCount,y=Math.max(1,t.thickness*(fo+(1-fo)*M));e.push({x:be(f,m,v)-l*.5,y:be(c,g,v)-y*.5,width:l,height:y,speedPxPerSec:t.speedPxPerSec,opacity:t.baseOpacity*(ho+(1-ho)*M)*r,fade:1,driftX:0,driftY:0,colorSeed:t.colorSeed,direction:"vortexSingular",rot:S}),i++}s+=b}}function po(e,t,a){let r=t.vortexSingular,n=[];for(let o of e.tails){Kd(o,r);let l=qd(a-o.bornMs,o.lifeMs)*jd(o,a);l<=.001||Jd(n,o,r,l)}e.flames=n}function Qd(e,t,a,r){let n=t.vortexSingular;if(e.lastStepMs===null){e.lastStepMs=r,e.tails=[];for(let i=0;i<t.maxActive;i++)e.tails.push(dr(e.random,t,a,r,!0));po(e,t,r);return}let o=Math.min(.1,Math.max(0,(r-e.lastStepMs)/1e3));for(e.lastStepMs=r;e.tails.length<t.maxActive;)e.tails.push(dr(e.random,t,a,r,!1));e.tails.length>t.maxActive&&(e.tails.length=t.maxActive);let l=n.edgeMarginRatio*Math.min(a.width,a.height);for(let i=0;i<e.tails.length;i++){let s=e.tails[i];r-s.bornMs>=s.lifeMs&&(s=dr(e.random,t,a,r,!1),e.tails[i]=s),!s.hidden&&r>=s.phaseEndMs?(s.hidden=!0,s.phaseEndMs=r+be(n.hiddenMinMs,n.hiddenMaxMs,e.random())):s.hidden&&r>=s.phaseEndMs&&(s.hidden=!1,s.shownAtMs=r,s.phaseEndMs=r+Ri(s.speedPxPerSec,n)+be(n.visibleMinMs,n.visibleMaxMs,e.random()),s.trailX=[s.x],s.trailY=[s.y]);let u=(r-s.bornMs)/1e3,f=$d(s,u,n)+Yd(s,a.width,a.height,l);s.heading+=f*o,s.x+=Math.cos(s.heading)*s.speedPxPerSec*o,s.y+=Math.sin(s.heading)*s.speedPxPerSec*o;let c=s.trailX.length-1;Math.hypot(s.x-s.trailX[c],s.y-s.trailY[c])>=Nd&&(s.trailX.push(s.x),s.trailY.push(s.y))}po(e,t,r)}var Zd=1,e0=2;function hr(e){return{flames:[],tails:[],nextSpawnMs:0,lastStepMs:null,displayWidth:0,displayHeight:0,random:e}}function Yt(e,t,a){return be(t,a,e())}function mo(e,t,a,r){return Yt(e,t*a,t*r)}function go(e,t,a){return Yt(e,0,Math.max(0,t-a))}function Ra(e){return e==="up"||e==="down"||e==="upDown"}function t0(e){switch(e){case"upDown":return["up","down"];case"leftRight":return["left","right"];default:return[e]}}function a0(e,t){let a=t0(t);return a[Math.floor(e.random()*a.length)%a.length]}function r0(e){let t=.4+-.34*Math.min(1,Math.max(0,e));return{inner:.5-t,outer:.5+t}}function Ei(e){let t=e.baseSpeedPxPerSec*.5*e.speedVariation;return{minPxPerSec:Math.max(1,e.baseSpeedPxPerSec-t),maxPxPerSec:e.baseSpeedPxPerSec+t}}function n0(e,t,a,r){let n=Math.imul(Math.round(e*977)^2654435769,2246822507);return n=Math.imul(n^Math.round(t*1013),3266489909),n=Math.imul(n^Math.round(a*131),668265263),n=Math.imul(n^Math.round(r*100003),374761393),n^=n>>>15,(n>>>0)/4294967296}function wa(e,t){let a=Math.imul(Math.round(e*4294967296)^t,2246822507);return a=Math.imul(a^a>>>13,3266489909),a^=a>>>16,(a>>>0)/4294967296}var o0=2654435769,i0=2146121005,l0=625341585,s0=656542357,u0=1.8,vo=.6,c0=1.4,f0=.6,xo=.45,d0=1.55;function h0(e,t){let a=Math.max(.001,t.to-t.from),r=vo+(c0-vo)*wa(e,i0),n=Math.min(.95,Math.max(.02,t.ramp*r)),o=wa(e,o0)**u0,l=t.spread*(1-n)*o,i=(t.progress-t.from)/a,s=Math.min(1,Math.max(0,(i-l)/n));return t.outgoing?s:1-s}function p0(e,t){if(t===null){for(let a=0;a<e.length;a++){let r=e[a];r.fade=1,r.driftX=0,r.driftY=0}return}for(let a=0;a<e.length;a++){let r=e[a],n=h0(r.colorSeed,t);r.fade=1-n*n*(3-2*n);let o=t.travelPx*n*Math.sqrt(n);if(o===0){r.driftX=0,r.driftY=0;continue}let l=r.x+r.width*.5-t.centerX,i=r.y+r.height*.5-t.centerY,s=(l===0&&i===0?0:Math.atan2(i,l))+(wa(r.colorSeed,l0)*2-1)*f0,u=xo+(d0-xo)*wa(r.colorSeed,s0);r.driftX=Math.cos(s)*o*u,r.driftY=Math.sin(s)*o*u}}function m0(e,t,a,r,n){let o=mo(e.random,a,t.minWidthRatio,t.maxWidthRatio),l=mo(e.random,r,t.minHeightRatio,t.maxHeightRatio),i=Ei(t),s=Yt(e.random,i.minPxPerSec,i.maxPxPerSec),u=Yt(e.random,t.opacityMin,t.opacityMax),f={width:o,height:l,speedPxPerSec:s,opacity:u,fade:1,driftX:0,driftY:0,colorSeed:n0(o,l,s,u),direction:n,rot:0};return Ra(n)?{...f,x:go(e.random,a,o),y:0}:{...f,x:0,y:go(e.random,r,l)}}function g0(e,t,a,r){switch(t){case"up":e.y=r;break;case"down":e.y=-e.height;break;case"left":e.x=a;break;case"right":e.x=-e.width;break}}function Ai(e,t,a,r){let n=m0(e,t,a,r,a0(e,t.direction));return g0(n,n.direction,a,r),n}function v0(e,t){switch(e.direction){case"up":return e.y+e.height>=0;case"down":return e.y<=t.height;case"left":return e.x+e.width>=0;case"right":return e.x<=t.width;default:return!1}}function ki(e,t){switch(e.direction){case"up":e.y-=e.speedPxPerSec*t;break;case"down":e.y+=e.speedPxPerSec*t;break;case"left":e.x-=e.speedPxPerSec*t;break;case"right":e.x+=e.speedPxPerSec*t;break}}function x0(e,t){let a=0;for(let r=0;r<e.flames.length;r++){let n=e.flames[r];v0(n,t)&&(e.flames[a]=n,a++)}e.flames.length=a}function bo(e,t,a){let r=Math.max(0,a)/1e3;if(r>0)for(let n=0;n<e.flames.length;n++)ki(e.flames[n],r);x0(e,t)}function Ar(e,t){let a=t.spawnIntervalMs+Yt(e.random,-t.spawnJitterMs,t.spawnJitterMs);return Math.max(Zd,a)}function b0(e,t){return(Ra(e.direction)?t.height+e.height:t.width+e.width)/e.speedPxPerSec*1e3}function S0(e,t){let a=Ra(e.direction);return(a?t.height:t.width)*(1+(a?e.maxHeightRatio:e.maxWidthRatio))/Ei(e).minPxPerSec*1e3}function So(e,t){let a=0,r=1/0;for(let n=0;n<e.length;n++){let o=e[n];o.deathMs<t||(e[a]=o,a++,r=Math.min(r,o.deathMs))}return e.length=a,r}function yo(e,t,a,r){let n=r-S0(t,a)*e0,o=[],l=1/0;for(e.nextSpawnMs=n+Ar(e,t)*e.random();e.nextSpawnMs<=r;){let i=e.nextSpawnMs;if(l<i&&(l=So(o,i)),o.length<t.maxActive){let s=Ai(e,t,a.width,a.height),u=i+b0(s,a);o.push({flame:s,bornMs:i,deathMs:u}),l=Math.min(l,u)}e.nextSpawnMs=i+Ar(e,t)}l<r&&So(o,r),e.flames.length=0;for(let i=0;i<o.length;i++){let s=o[i];ki(s.flame,(r-s.bornMs)/1e3),e.flames.push(s.flame)}}function y0(e,t,a,r,n){let o=r;for(;e.nextSpawnMs<=n;){let l=Math.max(o,e.nextSpawnMs);bo(e,a,l-o),o=l,e.flames.length<t.maxActive&&e.flames.push(Ai(e,t,a.width,a.height)),e.nextSpawnMs=l+Ar(e,t)}bo(e,a,n-o),e.flames.length>t.maxActive&&(e.flames.length=t.maxActive)}function M0(e,t,a,r){if(!(!t.enabled||a.width<=0||a.height<=0)){if((e.displayWidth!==a.width||e.displayHeight!==a.height)&&(e.flames.length=0,e.tails.length=0,e.nextSpawnMs=0,e.lastStepMs=null,e.displayWidth=a.width,e.displayHeight=a.height),t.direction==="vortexSingular"){Qd(e,t,a,r);return}if(e.lastStepMs===null){yo(e,t,a,r),e.lastStepMs=r;return}if(r<e.lastStepMs){yo(e,t,a,r),e.lastStepMs=r;return}y0(e,t,a,e.lastStepMs,r),e.lastStepMs=r}}function Mo(e,t=!0){let a=t?e.getExtension("EXT_disjoint_timer_query_webgl2"):null;if(!a)return{supported:!1,begin(){},end(){},poll(){},latest:()=>({})};let r=[],n={},o=null;return{supported:!0,begin(l){o&&=(e.endQuery(a.TIME_ELAPSED_EXT),r.push(o),null);let i=e.createQuery();i&&(o={name:l,query:i},e.beginQuery(a.TIME_ELAPSED_EXT,i))},end(){o&&=(e.endQuery(a.TIME_ELAPSED_EXT),r.push(o),null)},poll(){let l=e.getParameter(a.GPU_DISJOINT_EXT);for(let i=r.length-1;i>=0;i--){let s=r[i],u=e.getQueryParameter(s.query,e.QUERY_RESULT_AVAILABLE);if(u||l){if(u&&!l){let f=e.getQueryParameter(s.query,e.QUERY_RESULT);n[s.name]=f/1e6}e.deleteQuery(s.query),r.splice(i,1)}}},latest:()=>({...n})}}function pr(e,t){if(e.length===0)return 0;let a=[...e].sort((n,o)=>n-o),r=Math.ceil(t*a.length);return a[Math.min(a.length-1,Math.max(0,r-1))]}function w0(e=240){let t=[],a={};return{recordFrame(r){t.push(r),t.length>e&&t.shift()},recordPasses(r){a=r},reset(){t.length=0,a={}},snapshot(){let r=pr(t,.5);return{fps:r>0?1e3/r:0,frameMs:{p50:r,p95:pr(t,.95),p99:pr(t,.99)},passMs:{...a},sampleCount:t.length}}}}function wo(e){let t=new Map;return{get(a,r,n,o){let l=t.get(a);if(l)return ba(e,l,r,n),l;let i=rt(e,r,n,o);return t.set(a,i),i},dispose(){for(let a of t.values())Ye(e,a);t.clear()}}}function P0(e,t){for(let a of e){t.begin(a.name),a.name;try{a.render()}finally{t.end()}}}function Di(e){return typeof HTMLVideoElement<"u"&&e instanceof HTMLVideoElement}function C0(e){return typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement}function T0(e){return typeof VideoFrame<"u"&&e instanceof VideoFrame}function Po(e){return Di(e)?{width:e.videoWidth||1,height:e.videoHeight||1}:C0(e)?{width:e.naturalWidth||1,height:e.naturalHeight||1}:T0(e)?{width:e.displayWidth||1,height:e.displayHeight||1}:{width:e.width||1,height:e.height||1}}function R0(e,t){let a=e.createTexture();if(!a)throw Error("Failed to create source texture");let r=Di(t),{width:n,height:o}=Po(t);function l(i){e.bindTexture(e.TEXTURE_2D,a),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!0),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,i),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1)}return e.bindTexture(e.TEXTURE_2D,a),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),l(t),{texture:a,get width(){return n},get height(){return o},isVideo:r,update(){if(!r)return;let i=t;i.readyState<2||(n=i.videoWidth||n,o=i.videoHeight||o,l(t))},uploadFrame(i){let s=Po(i);n=s.width||n,o=s.height||o,l(i)},dispose(){e.deleteTexture(a)}}}function mr(e,t,a,r,n,o,l,i){if(t<=0||r<=0||e<=0||a<=0||o<=0)return{u0:0,v0:0,u1:1,v1:1};let s=1,u=1,f=e/t,c=a/r;n==="width"?u=f/c:n==="height"?s=c/f:n!=="stretch"&&(n==="cover"?f>c?s=c/f:u=f/c:f>c?u=f/c:s=c/f),s/=o,u/=o;let m=.5+l*s*.5,g=.5+i*u*.5;return{u0:m-s/2,v0:g-u/2,u1:m+s/2,v1:g+u/2}}function E0(e,t,a,r){return{cols:Math.max(1,Math.ceil(e/a)),rows:Math.max(1,Math.ceil(t/r))}}function _r(e,t){let a=-1;for(let r=0;r<e.length;r++)e[r].startFrom<=t&&(a=r);return a}function Co(e){let t=new Uint8Array(1024);if(e.length===0)return t;let a=[...e].sort((r,n)=>r.startFrom-n.startFrom);for(let r=0;r<256;r++){let n=_r(a,r/255),o=r*4;if(n<0){t[o]=t[o+1]=t[o+2]=t[o+3]=0;continue}let l=a[n];t[o]=l.color>>16&255,t[o+1]=l.color>>8&255,t[o+2]=l.color&255,t[o+3]=Math.max(0,Math.min(255,Math.round(l.width*2)))}return t}function A0(e,t){let a=[...e].sort((i,s)=>i.startFrom-s.startFrom),r=Number.isFinite(t)?Math.max(0,Math.min(1,t)):0,n=a.map((i,s)=>({band:s,stripe:i})).filter(({stripe:i})=>i.width>=2&&i.opacity>.001).sort((i,s)=>s.stripe.startFrom-i.stripe.startFrom||s.band-i.band),o=r<=0?0:Math.ceil(n.length*r),l=new Set(n.slice(0,o).map(({band:i})=>i));return a.map((i,s)=>l.has(s))}function To(e,t=1){let a=new Uint8Array(1024);if(e.length===0)return a;let r=[...e].sort((o,l)=>o.startFrom-l.startFrom),n=A0(r,t);for(let o=0;o<256;o++){let l=_r(r,o/255),i=o*4,s=l<0?0:Math.max(0,Math.min(255,Math.round(r[l].opacity*255))),u=l<0?0:r.length<=1?1:l/(r.length-1);a[i]=s,a[i+1]=Math.max(0,Math.min(255,Math.round(u*255))),a[i+2]=l>=0&&n[l]?255:0,a[i+3]=l<0?0:Math.min(255,l+1)}return a}function kr(e){let t=new Uint8Array(1024);if(e.length===0)return t;let a=[...e].sort((o,l)=>o.startFrom-l.startFrom),r=new Int32Array(a.length).fill(-1);for(let o=0;o<256;o++){let l=_r(a,o/255);l>=0&&r[l]<0&&(r[l]=o)}let n=0;for(let o=0;o<Math.min(a.length,256);o++)r[o]>=0&&(n=r[o]),t[o*4]=n,t[o*4+3]=255;return t}function k0(e){return e.map(t=>`${t.color}:${t.startFrom}:${t.width}:${t.opacity}`).join("|")}function Fi(e){return e<0?0:e>1?1:e}function D0(e,t,a){let r=Fi((a-e)/Math.max(1e-5,t-e));return r*r*(3-2*r)}function F0(e,t,a){let r=Fi(t),n=Math.max(0,a);if(r<=0&&n<=0)return e;let o=e.filter(l=>l.startFrom>=r);return(o.length>0?o:e.slice(-1)).map(l=>{let i=D0(.45,1,l.startFrom),s=Math.max(r,l.startFrom-i*n*.12),u=Math.round(l.width*(1+i*n));return{...l,startFrom:s,width:Math.max(1,Math.min(64,u))}})}function ga(e){return e.colors.mode==="colors"?F0(e.stripes,e.colors.imageColorRemoveThin,e.colors.imageColorBoostThick):e.stripes}var gr=240;function L0(e,t,a){if(t<=0||a<=0||e.length<t*a*4)return 0;let r=new Map,n=new Map,o=new Map,l=new Map,i=(b,S)=>{let v=(S*t+b)*4,M=e[v]&gr,y=e[v+1]&gr,x=e[v+2]&gr,T=M<<16|y<<8|x;r.set(T,(r.get(T)??0)+1),n.set(T,(n.get(T)??0)+e[v]),o.set(T,(o.get(T)??0)+e[v+1]),l.set(T,(l.get(T)??0)+e[v+2])};for(let b=0;b<t;b++)i(b,0),i(b,a-1);for(let b=1;b<a-1;b++)i(0,b),i(t-1,b);let s=0,u=0;for(let[b,S]of r)S>u&&(u=S,s=b);if(u===0)return 0;let f=u,c=Math.round((n.get(s)??0)/f),m=Math.round((o.get(s)??0)/f),g=Math.round((l.get(s)??0)/f);return(c&255)<<16|(m&255)<<8|g&255}var U0=24,B0=6,I0=32;function vr(e){return Math.min(255,Math.max(0,Math.round(e)))}function _0(e,t,a){let r=Ts(e,t,a);if(r<=0)return 0;let n=Cs(e,t,a),o=1-Math.abs(n-.5)*2;return r*Math.max(0,o)}function W0(e,t){let a=e.r-t.r,r=e.g-t.g,n=e.b-t.b;return Math.sqrt(a*a+r*r+n*n)}function G0(e,t){let a=[];for(let r of e)a.every(n=>W0(n,r)>=t)&&a.push(r);return a}function O0(e,t,a){let r=(e%360+360)%360,n=(1-Math.abs(2*a-1))*t,o=n*(1-Math.abs(r/60%2-1)),l=a-n/2,i=0,s=0,u=0;return r<60?(i=n,s=o):r<120?(i=o,s=n):r<180?(s=n,u=o):r<240?(s=o,u=n):r<300?(i=o,u=n):(i=n,u=o),{r:vr((i+l)*255),g:vr((s+l)*255),b:vr((u+l)*255)}}function jt(e=8){let t=[];for(let a=0;a<e;a++)t.push(O0(360/e*a,.85,.55));return t}function z0(e,t,a,r={}){if(t<=0||a<=0||e.length<t*a*4)return jt();let n=r.maxColors??U0,o=Math.max(1,r.stride??B0),l=r.dedupeDistance??I0,i=[];for(let u=0;u<a;u+=o)for(let f=0;f<t;f+=o){let c=(u*t+f)*4,m=e[c]??0,g=e[c+1]??0,b=e[c+2]??0,S=_0(m,g,b);S<=0||i.push({color:{r:m,g,b},score:S})}if(i.length===0)return jt();i.sort((u,f)=>f.score-u.score);let s=G0(i.slice(0,n*3).map(u=>u.color),l);return s.length===0?jt():s.slice(0,n)}var H0=`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 finalColor;
${si}
void main() {
  vec3 col = adjustedColor(vUv);
  float d = clamp(length(col - uColorBg) / sqrt(3.0), 0.0, 1.0);
  finalColor = vec4(d, 0.0, 0.0, 1.0);
}
`;function Ro(e,t){let a=V(e,Q,H0),r=o=>e.getUniformLocation(a,o),n={src:r("uSource"),rect:r("uSrcRect"),texel:r("uTexel"),bg:r("uBg"),colorBg:r("uColorBg"),blur:r("uBlur"),sharpen:r("uSharpen"),black:r("uBlack"),white:r("uWhite"),gamma:r("uGamma"),exposure:r("uExposure"),contrast:r("uContrast"),brightThresh:r("uBrightThresh"),invert:r("uInvert"),posterize:r("uPosterize"),noise:r("uNoise")};return{render(o,l,i){X(e,o),e.useProgram(a),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,l),e.uniform1i(n.src,0),e.uniform4f(n.rect,i.srcRect.u0,i.srcRect.v0,i.srcRect.u1,i.srcRect.v1),e.uniform2f(n.texel,i.sourceTexelW,i.sourceTexelH);let s=i.adjustments;e.uniform3f(n.bg,...Ce(i.background)),e.uniform3f(n.colorBg,...Ce(i.colorBackground)),e.uniform1f(n.blur,s.blurRadius),e.uniform1f(n.sharpen,s.sharpenAmount),e.uniform1f(n.black,s.blackPoint),e.uniform1f(n.white,s.whitePoint),e.uniform1f(n.gamma,s.gamma),e.uniform1f(n.exposure,s.exposure),e.uniform1f(n.contrast,s.contrast),e.uniform1f(n.brightThresh,s.brightness+s.thresholdBias),e.uniform1f(n.invert,+!!s.invert),e.uniform1f(n.posterize,s.posterizeLevels),e.uniform1f(n.noise,s.noiseAmount),t.draw()},dispose(){e.deleteProgram(a)}}}var V0=`#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uSrcSize;
out vec4 finalColor;
void main() {
  vec2 srcStart = floor(gl_FragCoord.xy) * 4.0;
  float m = 0.0;
  for (int y = 0; y < 4; y++) {
    for (int x = 0; x < 4; x++) {
      vec2 p = (srcStart + vec2(float(x), float(y)) + 0.5) / uSrcSize;
      m = max(m, texture(uTex, p).r);
    }
  }
  finalColor = vec4(m, 0.0, 0.0, 1.0);
}
`;function Eo(e,t){let a=V(e,Q,V0),r=e.getUniformLocation(a,"uTex"),n=e.getUniformLocation(a,"uSrcSize");return{render(o,l,i,s){X(e,o),e.useProgram(a),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,l),e.uniform1i(r,0),e.uniform2f(n,i,s),t.draw()},dispose(){e.deleteProgram(a)}}}function N0(e){let t=null,a=0,r=null;function n(l,i,s){let u=l??e.createBuffer();return u?(e.bindBuffer(e.PIXEL_PACK_BUFFER,u),i!==s&&e.bufferData(e.PIXEL_PACK_BUFFER,s,e.STREAM_READ),u):null}function o(l,i){e.bindBuffer(e.PIXEL_PACK_BUFFER,l),e.getBufferSubData(e.PIXEL_PACK_BUFFER,0,i)}return{get inFlight(){return r!==null},request(l,i,s){if(r||l<=0||i<=0)return;let u=l*i*4;if(t=n(t,a,u),!t)return;a=u,e.bindFramebuffer(e.FRAMEBUFFER,s),e.readPixels(0,0,l,i,e.RGBA,e.UNSIGNED_BYTE,0),e.bindBuffer(e.PIXEL_PACK_BUFFER,null),e.bindFramebuffer(e.FRAMEBUFFER,null);let f=e.fenceSync(e.SYNC_GPU_COMMANDS_COMPLETE,0);f&&(e.flush(),r={sync:f,cols:l,rows:i})},poll(){if(!r)return null;let l=e.clientWaitSync(r.sync,0,0);if(l===e.TIMEOUT_EXPIRED)return null;let{cols:i,rows:s}=r;if(e.deleteSync(r.sync),r=null,l===e.WAIT_FAILED||!t)return null;let u=new Uint8Array(i*s*4);o(t,u);let f=new Uint8Array(i*s);for(let c=0;c<f.length;c++)f[c]=u[c*4];return e.bindBuffer(e.PIXEL_PACK_BUFFER,null),{cols:i,rows:s,values:f,colors:null}},cancel(){r&&=(e.deleteSync(r.sync),null)},dispose(){r&&=(e.deleteSync(r.sync),null),t&&e.deleteBuffer(t),t=null,a=0}}}function at(e){return e-Math.floor(e)}function Dr(e,t){let a=at(e*.1031),r=at(t*.103),n=at(e*.0973),o=a*(r+33.33)+r*(n+33.33)+n*(a+33.33);return a=at(a+o),r=at(r+o),n=at(n+o),at((a+r)*n)}function Ao(e,t,a){let r=a*.61803398875;return Dr(e+r+307,t+r+401)*2-1}function X0(e,t,a){if(!a.enabled||a.amplitudePx<=0||a.maxOffsetPx<=0)return 0;let r=a.staggerPx*.61803398875,n=.65+Dr(e+r+89,r+113)*.7,o=Dr(e+r+179,r+233)*7,l=t*Math.max(a.speed,.05)*n+o,i=Math.floor(l),s=at(l),u=s*s*(3-2*s),f=Ao(e,i,a.staggerPx);return(f+(Ao(e,i+1,a.staggerPx)-f)*u)*Math.min(Math.max(a.amplitudePx,0),Math.max(a.maxOffsetPx,0))}function q0(e,t,a,r,n,o){if(e.columns.length===0)return null;let l=1/0,i=1/0,s=-1/0,u=-1/0;for(let f of e.columns){let c=X0(f.col,o,a);l=Math.min(l,f.col*t.cellWidth),s=Math.max(s,(f.col+1)*t.cellWidth),i=Math.min(i,f.minRow*t.cellHeight+c),u=Math.max(u,(f.maxRow+1)*t.cellHeight+c)}return l=Math.max(0,Math.min(r,l)),i=Math.max(0,Math.min(n,i)),s=Math.max(0,Math.min(r,s)),u=Math.max(0,Math.min(n,u)),s-l<1||u-i<1?null:{x:Math.round(l)+.5,y:Math.round(i)+.5,width:Math.max(1,Math.round(s-l)-1),height:Math.max(1,Math.round(u-i)-1),labelX:l,labelY:i,label:`${Math.round(l)}, ${Math.round(i)}`,alpha:1,scale:1}}function j0(e,t,a,r,n,o){let l=[];for(let i of e){let s=q0(i,t,a,r,n,o);s&&l.push(s)}return l}function $0(e,t){let a=Math.imul(e,2654435769)+Math.imul(t,2246822507)+3266489913>>>0,r=Math.imul(a,747796405)+2891336453>>>0,n=Math.imul(r>>>(r>>>28)+4^r,277803737)>>>0;return(n>>>22^n)>>>0}function Y0(e,t){return Math.fround(Math.fround(1-Math.fround(e))*Math.fround(t))}function K0(e,t,a){let r=Math.fround(a),n=Math.fround(r-Math.floor(r)),o=Math.floor(Math.fround(n*65536));return+($0(e,t)>>>16<o)}function J0(e,t,a,r){if(!t)return e;let n=e.values.slice(),o=[...r].sort((f,c)=>f.startFrom-c.startFrom),l=o.length,i=kr(o),s=Math.min(t.cssWidth,t.cssHeight),u=f=>{let c=-1;for(let m=0;m<o.length;m++)o[m].startFrom<=f&&(c=m);return c};for(let f=0;f<e.rows;f++)for(let c=0;c<e.cols;c++){let m=f*e.cols+c,g=vc(t,(c+.5)/e.cols,(f+.5)/e.rows),b=xc(g,a,s);if(b>=1)continue;if(!g.inside||l<1){n[m]=0;continue}let S=u((n[m]??0)/255),v=Y0(b,l),M=K0(c,f,v),y=S-Math.floor(v)-M;n[m]=y<0?0:i[y*4]}return{...e,values:n}}function Q0(e,t,a=1,r=[],n=3,o=0){let{cols:l,rows:i,values:s}=e,u=Math.round(Math.max(0,Math.min(1,t))*255),f=Math.round(Math.max(0,Math.min(8,a))),c=[...r].sort((y,x)=>y.startFrom-x.startFrom),m=new Set(c.map((y,x)=>({stripe:y,band:x})).filter(({stripe:y})=>y.width>=.5&&y.opacity>.001).sort((y,x)=>x.stripe.startFrom-y.stripe.startFrom||x.band-y.band).slice(0,Math.max(1,Math.round(n))).map(({band:y})=>y)),g=new Uint8Array(l*i),b=y=>{if(c.length===0)return!0;let x=y/255,T=-1;for(let R=0;R<c.length;R++)c[R].startFrom<=x&&(T=R);return m.has(T)};for(let y=0;y<i;y++){let x=i-1-y;for(let T=0;T<l;T++){let R=s[y*l+T]??0;R>=u&&b(R)&&(g[x*l+T]=1)}}let S=[],v=[];for(let y=0;y<i;y++)for(let x=0;x<l;x++){let T=y*l+x;if(g[T]===0)continue;g[T]=0,v.length=0,v.push(T);let R=new Map,C=0;for(let w=0;w<v.length;w++){let p=v[w],E=Math.floor(p/l),D=p-E*l,L=R.get(D);L?E<L.minRow?L.minRow=E:E>L.maxRow&&(L.maxRow=E):R.set(D,{col:D,minRow:E,maxRow:E});let H=s[(i-1-E)*l+D]??0;H>C&&(C=H);for(let U=-f;U<=f;U++)for(let A=-f;A<=f;A++){if(U===0&&A===0)continue;let ee=D+A,Se=E+U;if(ee<0||ee>=l||Se<0||Se>=i)continue;let we=Se*l+ee;g[we]!==0&&(g[we]=0,v.push(we))}}S.push({group:{columns:[...R.values()].sort((w,p)=>w.col-p.col)},peak:C,cells:v.length,order:S.length})}let M=Math.round(Math.max(0,Math.min(64,o)));return M>0&&S.length>M?S.slice().sort((y,x)=>x.peak-y.peak||x.cells-y.cells||y.order-x.order).slice(0,M).sort((y,x)=>y.order-x.order).map(y=>y.group):S.map(y=>y.group)}var Z0=100;function eh(e,t,a,r){return Math.max(Math.hypot(e,t),Math.hypot(a-e,t),Math.hypot(e,r-t),Math.hypot(a-e,r-t))}function th(e,t,a,r,n){let o=a-(t>0?Math.min(1,e/t)*r:0);return o<0?-1:n<=0?1:Math.min(1,o/n)}function ah(){let e=null,t=!1,a=0,r=0;function n(){e=null,t=!1,a=0,r=0}return{apply(o,l){let{cursor:i,nowMs:s,spawnScale:u}=l,f=i!==null;f&&!t&&i&&(e={x:i.x,y:i.y}),t=f;let c=Math.min(Math.max(s-r,0),Z0);r=s;let m=l.staggerMs+l.growMs;if(a=Math.min(Math.max(a+(t?c:-c),0),m),!e||!t&&a<=0){for(let S of o)S.alpha=0,S.scale=u;return!1}let g=eh(e.x,e.y,l.cssWidth,l.cssHeight),b=!1;for(let S of o){let v=th(Math.hypot(S.x+S.width*.5-e.x,S.y+S.height*.5-e.y),g,a,l.staggerMs,l.growMs);if(v<0){S.alpha=0,S.scale=u;continue}S.alpha=1,S.scale=u+(1-u)*Mt(0,1,v),b=!0}return b},active(){return t||a>0},reset:n}}var rh=33;function ko(e){let t=N0(e),a=ah(),r=null,n=-1/0,o=-1,l=!1;function i(){r=null,n=-1/0,o=-1,a.reset(),t.cancel()}return{update(s){let{frames:u}=s.config;if(!u.enabled)return(r||o>=0)&&i(),null;if(!s.settled)return o>=0&&i(),null;o<0&&(o=s.nowMs);let f=u.revealOn==="hover";f!==l&&(l=f,a.reset()),(!f||r===null||a.active())&&s.nowMs-n>=rh&&!t.inFlight&&(n=s.nowMs,t.request(s.cols,s.rows,s.valuesFbo()));let c=t.poll();if(c){let g=ga(s.config);r=Q0(J0(c,s.contourField,s.config.edgeMask,g),u.luminanceThreshold,u.groupDistanceCells,g,u.highlightedStripeCount,u.maxFrames)}if(!r)return null;let m=j0(r,s.config.grid,s.config.sparkle.motion,s.cssWidth,s.cssHeight,s.timeSec);return f&&!a.apply(m,{nowMs:s.nowMs,cursor:s.cursor,cssWidth:s.cssWidth,cssHeight:s.cssHeight,staggerMs:u.staggerMs,growMs:u.growMs,spawnScale:u.spawnScale})?null:{boxes:m,cssWidth:s.cssWidth,cssHeight:s.cssHeight,scale:s.dpr,color:u.color,coordinateColor:u.coordinateColor,strokeWidthPx:u.strokeWidthPx,cornerSizePx:u.cornerSizePx,dashLengthPx:u.dashLengthPx,dashGapPx:u.dashGapPx,fontSizePx:u.fontSizePx,connection:u.connection,alpha:f||u.fadeMs<=0?1:Mt(0,1,(s.nowMs-o)/u.fadeMs)}},dispose(){i(),t.dispose()}}}function Do(e){let t=new Map,a=(n,o,l)=>{let i=t.get(n);!i||i.cols===o&&i.rows===l||(i.runtime.dispose(),t.delete(n))},r=(n,o,l)=>{a(n,o,l);let i=t.get(n);if(i)return i;let s={runtime:e(n),overlay:null,cols:o,rows:l};return t.set(n,s),s};return{update(n,o){let l=r(n,o.cols,o.rows);return l.overlay=l.runtime.update(o),l.overlay},read(n){return t.get(n)?.overlay??null},setGridSize:a,release(n){let o=t.get(n);o&&(o.runtime.dispose(),t.delete(n))},reset(){for(let n of t.values())n.runtime.dispose();t.clear()},abandon(){t.clear()}}}function nh(e){let[t,a]=e==="center"?["center","center"]:e.split(" ");return[t==="left"?0:t==="right"?1:.5,a==="top"?0:a==="bottom"?1:.5]}function qe(e){if(e.type==="wave"||e.type==="custom")return e.wave.durationMs;if(e.type==="whirlpool")return e.whirlpool.durationMs;if(e.type==="water")return e.water.durationMs+e.water.settleMs;if(e.type==="supernova"||e.type==="tidal"||e.type==="magma")return e[e.type].durationMs;if(e.type==="blackhole"){let a=e.blackhole;return a.formMs+a.staggerMs+a.speedMaxMs+a.collapseMs}let t=e.type==="assembly"?e.assembly:e[e.type];return t.staggerMs+t.speedMaxMs}function oh(e){return Math.min(.4,Math.max(.04,330/e))}function ih(e,t,a){let r=Math.max(1,Math.round(t)),n=Math.min(1,Math.max(0,e)),o=n,l=Math.min(o,1-o),i=n*r,s=Math.min(r-1,Math.floor(i)),u=i-s,f=u*u*(3-2*u),c=s%2==0?f*2-1:1-f*2,m=Math.sin(n*Math.PI*2*r*1.5)*a*.05,g=c*l+m;return{x:Math.min(1,Math.max(0,o+g)),y:Math.min(1,Math.max(0,o-g))}}function lh(e){let t=0,a=-1,r=0,n=0,o=!0;function l(){return o?n+(e.now()-r):n}return{elapsedMs(){return a!==t&&(a=t,r=e.now(),n=0),l()},animating(i){return o?a===t?l()<i:!0:!1},trigger(){t++},setGate(i){i!==o&&(i?r=e.now():a===t&&(n+=e.now()-r),o=i)},get gateOpen(){return o}}}var Fo=1/60;function sh(){let e=Tr(900),t=-1,a=!1,r=0,n=0;return{reset(){e=Tr(900),t=-1,a=!1,r=0,n=0},advance(o,l,i,s,u){let f=t<0?Fo:Math.max(0,Math.min(Ma,(o-t)/1e3));t=o;let c=e.take(f),m=r,g=n,b=0;if(l<1){let v=ih(l,i,s);m=v.x,g=1-v.y,b=u}a||=(r=m,n=g,!0);let S={substeps:c,ax:r,ay:n,bx:m,by:g,amp:b,soakScale:f/Fo};return c>0&&(r=m,n=g),S}}}var uh=`#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uPrevCover;
uniform sampler2D uHeight;
uniform float uRevealK;
uniform float uGamma;
uniform float uSoak;
out vec4 outColor;

// Cover is driven only by the water that touches each pixel — there is no global
// end-of-animation fill, so a pixel the water never reaches stays hidden.
// Two ways water reveals, both local:
//   peak  — the whitest water that ever hit it, immediate
//   soak  — water that keeps washing over it finishes it off
// Soak is what completes the image: the weakest pixels only ever see a crest of
// ~0.1, so peak alone cannot reach 1 and the reveal would pop at the end.
void main() {
  float prev = texture(uPrevCover, vUv).r;
  float h = max(texture(uHeight, vUv).r, 0.0);
  float a = pow(h / (h + uRevealK), uGamma);
  float cover = min(1.0, max(prev, a) + a * uSoak);
  outColor = vec4(cover, 0.0, 0.0, 1.0);
}
`,Lo=2,Uo=420,ch=.5,fh=.72,dh=.3,hh=.045;function ph(e,t){let a=Ti(e,t),r=V(e,Q,uh),n=x=>e.getUniformLocation(r,x),o={prevCover:n("uPrevCover"),height:n("uHeight"),revealK:n("uRevealK"),gamma:n("uGamma"),soak:n("uSoak")},l=null,i=null,s=0,u=0,f=!1,c=!1,m=sh(),g=-1/0;function b(x){X(e,x),e.clearColor(0,0,0,1),e.clear(e.COLOR_BUFFER_BIT)}function S(){l&&(b(l.read()),b(l.write()),e.bindFramebuffer(e.FRAMEBUFFER,null))}function v(){i&&(b(i.read()),b(i.write()),e.bindFramebuffer(e.FRAMEBUFFER,null))}function M(){S(),v()}function y(x,T){if(!l||!i)return;let R=.8-.45*Math.min(1,Math.max(0,x));X(e,i.write()),e.useProgram(r),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,i.read().texture),e.uniform1i(o.prevCover,0),e.activeTexture(e.TEXTURE1),e.bindTexture(e.TEXTURE_2D,l.read().texture),e.uniform1i(o.height,1),e.uniform1f(o.revealK,dh),e.uniform1f(o.gamma,R),e.uniform1f(o.soak,hh*T),t.draw(),e.bindFramebuffer(e.FRAMEBUFFER,null),i.swap()}return{tick(x){if(f)return;x.sweepT<g&&(M(),m.reset()),g=x.sweepT;let T=Math.max(1,Math.round(x.displayWidth/Lo)),R=Math.max(1,Math.round(x.displayHeight/Lo)),C=Math.max(T,R);if(C>Uo){let w=Uo/C;T=Math.max(1,Math.round(T*w)),R=Math.max(1,Math.round(R*w))}try{if(!l||!i){if(!e.getExtension("EXT_color_buffer_float"))throw Error("EXT_color_buffer_float unavailable");l=Rr(e,T,R,{float:!0,linear:!0}),i=Rr(e,T,R,{linear:!0}),s=T,u=R,M()}else(T!==s||R!==u)&&(l.resize(T,R),s=T,u=R,S());let w=m.advance(x.elapsedMs,x.sweepT,x.rows,x.wobble,x.intensity),p=w.ax*T,E=w.ay*R,D=w.bx*T,L=w.by*R,H=w.amp*ch,U=Math.max(3,R/(Math.max(1,x.rows)*2.6));for(let A=0;A<w.substeps;A++){let ee=A/w.substeps,Se=(A+1)/w.substeps;a.render(l.write(),l.read(),{texelX:1/T,texelY:1/R,ax:p+(D-p)*ee,ay:E+(L-E)*ee,bx:p+(D-p)*Se,by:E+(L-E)*Se,amp:H,radius:U}),l.swap()}y(x.softness,w.soakScale),c=!0}catch(w){f=!0,console.warn("[stripes-engine] water reveal sim disabled:",w)}},current(){return f||!c||!l||!i?null:{height:l.read().texture,cover:i.read().texture,texelX:1/s,texelY:1/u}},release(){l?.dispose(),i?.dispose(),l=null,i=null,s=0,u=0,c=!1,g=-1/0,m.reset()},dispose(){a.dispose(),e.deleteProgram(r),l?.dispose(),i?.dispose(),l=null,i=null}}}var mh=2,gh=173516199,vh={turbulence:0,glitch:1};function Bo(e){return e==="turbulence"||e==="glitch"}function Jh(e,t={}){return Li(ms(e,t.dpr),{clock:t.clock,seed:t.seed,fieldScale:t.fieldScale,hooks:t.hooks,onWaterActivity:t.onWaterActivity,cssWidth:e.clientWidth||800,cssHeight:e.clientHeight||600})}function Qh(e){return Li(gs(e.context,e.dpr),{clock:e.clock,seed:e.seed,fieldScale:e.fieldScale,onWaterActivity:e.onWaterActivity,cssWidth:e.width,cssHeight:e.height,gpuTimings:!1})}function Li(e,t){let a=t.clock??ss(),r=t.hooks,n=a.now(),o=t.cssWidth,l=t.cssHeight,{gl:i,isP3:s,maxTextureSize:u}=e.acquireContext(),f={width:0,height:0},c={width:2,height:2},m={width:2,height:2},g={cols:1,rows:1},b=[],S=t.gpuTimings!==!1,v=0,M=0,y=Cn(i),x=wo(i),T=[],R=Mo(i,S),C=w0(),w=null,p=Ke({fieldScale:t.fieldScale}),E=null,D=null,L=null,H=!1,U=null,A=!1,ee=null,Se=()=>{},we=0,Kt=!1,Re=null,Ie=null,_e=null,Et=0,Aa="",We=ju(i),ka=a.now(),At=a.now()/1e3,Oi=cs(),pt=!1,zr=p.stripesEnabled,Da=()=>p.reveal.enabled?ct(p.reveal.type)?p.reveal.type:p.reveal.type==="wave"?"wave":p.reveal.type==="assembly"?"scatter":p.reveal.type==="vortex"?"vortex":p.reveal.type==="blackhole"?"blackhole":p.reveal.type==="whirlpool"?"whirlpool":p.reveal.type==="water"?"water":p.reveal.type==="custom"?r?.customReveal?"custom":"wave":"warp":"none",Hr=Da(),Fa=p.flames.enabled,Vr=()=>{let P=p.flames,k=P.vortexSingular;return[P.direction,P.minWidthRatio,P.maxWidthRatio,P.minHeightRatio,P.maxHeightRatio,P.baseSpeedPxPerSec,P.speedVariation,P.spawnIntervalMs,P.spawnJitterMs,P.maxActive,P.opacityMin,P.opacityMax,k.segCount,k.segSpacingPx,k.turnRate,k.turnVariation,k.visibleMinMs,k.visibleMaxMs,k.hiddenMinMs,k.hiddenMaxMs,k.lifeMinMs,k.lifeMaxMs,k.edgeMarginRatio].join("|")},Nr=Vr(),Xr=p.renderMode,La=p.cursorTrail.enabled,Ua=p.clickWave.enabled,Ba=p.clickWave.type,qr=p.letters.enabled,jr=p.colors.mode,Ia=p.background.stars.enabled,nt=lh(a),Ge=Do(()=>ko(i)),mt=In(i),Ee=null,Jt=new Map;function Qt(){return pt||!Ee?null:mt.get(Ee,{cols:g.cols,rows:g.rows,cssWidth:o,cssHeight:l})}function Oe(){return nt.elapsedMs()}function zi(){return p.reveal.enabled?nt.animating(qe(p.reveal)):!1}function _a(){return p.reveal.enabled?nt.elapsedMs()>=qe(p.reveal):!0}let gt=p.colors.backgroundColor,vt=null,ot=null,it=jt(),lt=Math.sqrt(3),kt=null,Dt=null,Zt="",ea=(t.seed??1)>>>0,Ft=hr(ht(ea)),Wa=(ea^gh)>>>0,ta=lr(ht(Wa)),Ne=fr(),xt=ir(),Lt=a.now(),Ga=null,$r=()=>Ne.target,De=null,Yr=p.cursorTrail.type,Oa=Cd(t.onWaterActivity),Kr=()=>p.cursorTrail.enabled&&p.cursorTrail.type==="constellation",za=()=>{if(!Kr())return"off";let P=Gn(p.cursorTrail.constellation);return`${P.maxStars}|${P.maxLinks}|${P.maxPulses}`},Jr=za(),Qr=()=>p.cursorTrail.enabled&&p.cursorTrail.type==="comet",Ha=()=>{if(!Qr())return"off";let P=eo(p.cursorTrail.comet);return`${P.nodeCount}|${P.maxEmbers}`},Zr=Ha(),Va=()=>p.background.meteors.enabled?String(ao(p.background.meteors).maxActive):"off",en=Va(),Na=()=>p.clickWave.enabled&&p.clickWave.type==="detonation",Xa=()=>{if(!Na())return"off";let P=sr(p.clickWave.detonation);return`${P.maxConcurrent}|${P.debrisCount}`},tn=Xa(),Ut=null,aa="",an=()=>{let P=sr(p.clickWave.detonation),k=`${P.maxConcurrent}|${P.debrisCount}|${p.clickWave.detonation.seed}`;return(!Ut||k!==aa)&&(Ut=jf(P,p.clickWave.detonation.seed),aa=k),Ut},qa=()=>{let P=p.reveal;return P.enabled&&ct(P.type)?oo(P.type,P[P.type]):"off"},ja=()=>{let P=p.clickWave;return P.enabled&&ct(P.type)?oo(P.type,P[P.type]):"off"},rn=qa(),nn=ja(),Xe=null;function on(){let P=p.clickWave;Xe=P.enabled&&ct(P.type)?gd(Xe,P.type,P[P.type]):null}function Hi(){return p.cursorTrail.enabled&&p.cursorTrail.type==="wave"}function Vi(){if(!Hi()){De&&(De.dispose(),De=null,Oa.settle());return}De??=Wd(i,y),De.tick(a.now(),Ne.target,o,l),Oa.report(De.activity())}function Ni(){De?.resetActivity(),Oa.settle()}function ra(){return e.getDpr()}function Xi(P){return typeof HTMLImageElement<"u"&&P instanceof HTMLImageElement||typeof ImageBitmap<"u"&&P instanceof ImageBitmap||typeof HTMLCanvasElement<"u"&&P instanceof HTMLCanvasElement||typeof OffscreenCanvas<"u"&&P instanceof OffscreenCanvas||typeof HTMLVideoElement<"u"&&P instanceof HTMLVideoElement}function ln(P,k){if(!Xi(P))return null;let z=1,N=1;typeof HTMLVideoElement<"u"&&P instanceof HTMLVideoElement?(z=P.videoWidth||1,N=P.videoHeight||1):typeof HTMLImageElement<"u"&&P instanceof HTMLImageElement?(z=P.naturalWidth||P.width||1,N=P.naturalHeight||P.height||1):(z=P.width||1,N=P.height||1);let te=Math.min(1,k/Math.max(z,N)),he=Math.max(1,Math.round(z*te)),ae=Math.max(1,Math.round(N*te)),ge=null;if(typeof document<"u"&&typeof document.createElement=="function"){let Ae=document.createElement("canvas");Ae.width=he,Ae.height=ae,ge=Ae.getContext("2d",{willReadFrequently:!0})}else typeof OffscreenCanvas<"u"&&(ge=new OffscreenCanvas(he,ae).getContext("2d",{willReadFrequently:!0}));return ge?(ge.drawImage(P,0,0,he,ae),{data:ge.getImageData(0,0,he,ae).data,w:he,h:ae}):null}function qi(P){try{let k=ln(P,64);return k?L0(k.data,k.w,k.h):p.colors.backgroundColor}catch{return p.colors.backgroundColor}}function ji(P){let k=null;try{k=P?ln(P,96):null}catch{k=null}it=k?z0(k.data,k.w,k.h):jt()}function $a(){return p.colors.autoDetectBackground?gt:p.colors.backgroundColor}function na(){let P=p.adjustments,k=p.transform;return[p.colors.mode,$a(),p.background.color,P.blackPoint,P.whitePoint,P.gamma,P.exposure,P.contrast,P.brightness,P.thresholdBias,+!!P.invert,P.posterizeLevels,P.noiseAmount,P.blurRadius,P.sharpenAmount,k.fit,k.zoom,k.panX,k.panY,m.width,m.height,f.width,f.height].join("|")}function oa(){if(Zt=na(),!w||p.colors.mode!=="colors"||!kt||!Dt){lt=Math.sqrt(3);return}w.update();let P=mr(w.width,w.height,f.width,f.height,p.transform.fit,p.transform.zoom,p.transform.panX,p.transform.panY),k=x.get("colorDistFull",m.width,m.height);kt.render(k,w.texture,{srcRect:P,adjustments:p.adjustments,background:p.background.color,colorBackground:$a(),sourceTexelW:1/w.width,sourceTexelH:1/w.height});let z=m.width,N=m.height,te=k.texture,he=k,ae=0;for(;z>1||N>1;){let Pe=Math.max(1,Math.ceil(z/4)),le=Math.max(1,Math.ceil(N/4)),Fe=x.get(`colorMaxReduce${ae}`,Pe,le);Dt.render(Fe,te,z,N),te=Fe.texture,he=Fe,z=Pe,N=le,ae++}let ge=new Uint8Array(4);i.bindFramebuffer(i.FRAMEBUFFER,he.fbo),i.readPixels(0,0,1,1,i.RGBA,i.UNSIGNED_BYTE,ge),i.bindFramebuffer(i.FRAMEBUFFER,null);let Ae=ge[0]/255*Math.sqrt(3);lt=Ae>1e-4?Ae:Math.sqrt(3)}function Ya(){let P=ga(p),k=`${k0(P)}|stripeDotsDensity:${p.stripeDots.density}`;if(k!==Aa){let z=Co(P),N=To(P,p.stripeDots.density),te=kr(P);Et=P.length,_e?wt(i,_e,te,256,1):_e=Ve(i,te,256,1),Re?wt(i,Re,z,256,1):Re=Ve(i,z,256,1),Ie?wt(i,Ie,N,256,1):Ie=Ve(i,N,256,1),Aa=k}}function $i(P){let k=ga(P);return{source:w,config:P,lutTex:Ve(i,Co(k),256,1),opacityLutTex:Ve(i,To(k,P.stripeDots.density),256,1),bandValueLutTex:Ve(i,kr(k),256,1),bandCount:k.length,palette:it,detectedBgColor:gt,maxColorDist:lt}}function Ka(){U&&=(U.source?.dispose(),i.deleteTexture(U.lutTex),i.deleteTexture(U.opacityLutTex),i.deleteTexture(U.bandValueLutTex),null)}function Yi(P,k){let z=w,N=p,te=Re,he=Ie,ae=_e,ge=Et,Ae=it,Pe=gt,le=lt;w=P.source,p=P.config,Re=P.lutTex,Ie=P.opacityLutTex,_e=P.bandValueLutTex,Et=P.bandCount,it=P.palette,gt=P.detectedBgColor,lt=P.maxColorDist,A=!0;try{k()}finally{A=!1,w=z,p=N,Re=te,Ie=he,_e=ae,Et=ge,it=Ae,gt=Pe,lt=le}}function sn(P,k){return We.ensureTextMap(P,k,p.grid.orientation,p.letters.text,p.letters.textCopies)}function ia(){for(let F of T)F.dispose();ee=null,Se=()=>{},vt&&=(vt.dispose(),null),ot&&=(ot.dispose(),null);let P=p.colors.mode==="colors",k;if(P){let F=As(i,y),I=xr(i);vt=I,k={name:"field",render:()=>{let _=x.get("field",c.width,c.height,{linear:!0}),B=x.get("fieldColor",c.width,c.height,{linear:!0});if(w){w.update();let W=mr(w.width,w.height,f.width,f.height,p.transform.fit,p.transform.zoom,p.transform.panX,p.transform.panY);F.render(I,_,B,w.texture,{srcRect:W,adjustments:p.adjustments,background:p.background.color,colorBackground:$a(),maxColorDist:lt,sourceTexelW:1/w.width,sourceTexelH:1/w.height})}else i.bindFramebuffer(i.FRAMEBUFFER,_.fbo),i.clearColor(0,0,0,1),i.clear(i.COLOR_BUFFER_BIT),i.bindFramebuffer(i.FRAMEBUFFER,B.fbo),i.clearColor(0,0,0,0),i.clear(i.COLOR_BUFFER_BIT)},dispose:()=>F.dispose()}}else{let F=Rs(i,y);k={name:"field",render:()=>{let I=x.get("field",c.width,c.height,{linear:!0});if(w){w.update();let _=mr(w.width,w.height,f.width,f.height,p.transform.fit,p.transform.zoom,p.transform.panX,p.transform.panY);F.render(I,w.texture,{srcRect:_,adjustments:p.adjustments,background:p.background.color,sourceTexelW:1/w.width,sourceTexelH:1/w.height,water:De?.current()??null})}else i.bindFramebuffer(i.FRAMEBUFFER,I.fbo),i.clearColor(0,0,0,1),i.clear(i.COLOR_BUFFER_BIT)},dispose:()=>F.dispose()}}let z={colorsMode:P,getFieldRT:()=>x.get("field",c.width,c.height,{linear:!0}),getFieldColorRT:()=>x.get("fieldColor",c.width,c.height,{linear:!0}),getPalette:()=>it},N=-1,te=()=>{N!==we&&(N=we,cc(ta,p.background.stars,{width:o,height:l},a.now()))},he=-1,ae=()=>{he!==we&&(he=we,M0(Ft,p.flames,{width:o,height:l},a.now()))};Se=()=>{p.background.stars.enabled&&te(),p.flames.enabled&&ae()};let ge=[];p.background.stars.enabled&&ge.push(Fn({...z,name:"backgroundStarsField",pass:lc(i),step:()=>(te(),{particles:ta.stars,opts:{canvasW:o,canvasH:l,color:p.background.stars.color}})}));let Ae=[];p.flames.enabled&&Ae.push(Fn({...z,name:"flamesField",pass:ec(i),step:()=>{ae();let F=E?.flameStaggerAt(a.now(),A)??null;(F||Kt)&&(p0(Ft.flames,F),Kt=F!==null);let{inner:I,outer:_}=r0(p.flames.edgeSharpness);return{particles:Ft.flames,opts:{canvasW:o,canvasH:l,vertical:Ra(p.flames.direction),inner:I,outer:_}}}}));let Pe=p.reveal.enabled,le=[],Fe=F=>{for(let I=F-1;I>=0;I--){let _=le[I];if(_.active())return _.field}return"field"},fn=F=>{for(let I=F-1;I>=0;I--){let _=le[I];if(_.color!==null&&_.active())return _.color}return"fieldColor"},dn=()=>A?"field":Fe(le.length),hn=()=>A?"fieldColor":fn(le.length),bt=()=>!0,sa=bt,Le=[];if(Pe&&ct(p.reveal.type)){let F=p.reveal.type,I=lo(i,y,F,"reveal",$t(F,p.reveal[F])),_=!1;sa=()=>_,Le.push({name:`${F}RevealField`,render:()=>{if(_=!1,!w||o<=0||l<=0)return;let B=p.reveal[F],W=Oe()/Math.max(1,B.durationMs);if(W>=1)return;let q=x.get("field",c.width,c.height,{linear:!0}),re=x.get("revealedField",c.width,c.height,{linear:!0});I.render(re,q.texture,{config:B,progress:W,cssW:o,cssH:l}),_=!0},dispose:()=>I.dispose()})}else if(Pe&&p.reveal.type==="vortex"){let F=Xs(i,y);Le.push({name:"vortexField",render:()=>{let I=x.get("field",c.width,c.height,{linear:!0}),_=x.get("revealedField",c.width,c.height,{linear:!0}),B=p.reveal.vortex,W=qe(p.reveal),q=Oe()/W,re=Math.max(1,B.staggerMs+B.speedMaxMs),ne=Math.max(0,B.speedMinMs),pe=Math.max(ne,B.speedMaxMs),oe=Math.min(.98,Math.max(.05,(ne+pe)/2/re)),j=B.staggerMs/re,Z=Math.round(280+280*B.detail),Ue=Math.max(2,Math.round(Z*l/Math.max(1,o)));F.render(_,I.texture,{progress:q,spread:j,flight:oe,gridX:Z,gridY:Ue,glow:B.glow,intensity:B.intensity,swirl:B.swirl,aspect:o/Math.max(1,l),count:Z*Ue*3})},dispose:()=>F.dispose()})}else if(Pe&&p.reveal.type==="blackhole"){let F=Ys(i,y);Le.push({name:"blackholeField",render:()=>{let I=x.get("field",c.width,c.height,{linear:!0}),_=x.get("revealedField",c.width,c.height,{linear:!0}),B=p.reveal.blackhole,W=qe(p.reveal),q=Math.max(1,W),re=Oe()/q,ne=Math.max(1,B.speedMinMs),pe=Math.max(ne,B.speedMaxMs),oe=Math.round(280+280*B.detail),j=Math.max(2,Math.round(oe*l/Math.max(1,o))),Z=4200;F.render(_,I.texture,{progress:re,form:B.formMs/q,spread:B.staggerMs/q,flightMin:ne/q,flightMax:pe/q,collapse:B.collapseMs/q,gridX:oe,gridY:j,glow:B.glow,swirl:B.swirl,arms:B.arms,lensing:B.lensing,horizon:B.horizon,intensity:B.intensity,aspect:o/Math.max(1,l),diskCount:Z,count:oe*j*3+Z})},dispose:()=>F.dispose()})}else if(Pe&&p.reveal.type==="whirlpool"){let F=Js(i,y);Le.push({name:"whirlpoolField",render:()=>{let I=x.get("field",c.width,c.height,{linear:!0}),_=x.get("revealedField",c.width,c.height,{linear:!0}),B=p.reveal.whirlpool,W=Math.max(1,qe(p.reveal)),q=Oe()/W;F.render(_,I.texture,{progress:q,turns:B.turns,tightness:B.tightness,streak:B.streak,glow:B.glow,aspect:o/Math.max(1,l)})},dispose:()=>F.dispose()})}else if(Pe&&Bo(p.reveal.type)){let F=zs(i,y);Le.push({name:"energyWarpField",render:()=>{let I=x.get("field",c.width,c.height,{linear:!0}),_=x.get("revealedField",c.width,c.height,{linear:!0});if(!Bo(p.reveal.type))return;let B=p.reveal.type,W=p.reveal[B],q=qe(p.reveal),re=Oe()/q,ne=Math.max(1,W.staggerMs+W.speedMaxMs),pe=Math.max(0,W.speedMinMs),oe=Math.max(pe,W.speedMaxMs),j=Math.min(.98,Math.max(.05,(pe+oe)/2/ne)),Z=W.staggerMs/ne;F.render(_,I.texture,{mode:vh[B]??0,progress:re,spread:Z,flight:j,intensity:W.intensity,detail:W.detail,glow:W.glow})},dispose:()=>F.dispose()})}else if(Pe&&p.reveal.type==="assembly"){let F=Gs(i),I=tu(i,y);Le.push({name:"assemblyScatterField",render:()=>{let _=x.get("field",c.width,c.height,{linear:!0}),B=x.get("revealedField",c.width,c.height,{linear:!0}),W=p.reveal.assembly,q=W.blurPx??Y.assembly.blurPx??0,re=W.blurStart??Y.assembly.blurStart??0,ne=qe(p.reveal),pe=Oe()/ne,oe=Math.max(0,Math.min(1,pe)),j=Math.max(1,W.staggerMs+W.speedMaxMs),Z=Math.max(0,W.speedMinMs),Ue=Math.max(Z,W.speedMaxMs),st=Math.min(.98,Math.max(.05,(Z+Ue)/2/j)),K=W.staggerMs/j,$=Math.max(1,W.sliceSizePx),J=Math.max(1,Math.ceil(o/$)),ue=Math.max(1,Math.ceil(l/$)),xe=Math.min(1,K+st),Je=_.texture,St=_.texture,Qe=_.texture;if(oe<xe&&q>0){let me={width:Math.max(1,Math.round(c.width/2)),height:Math.max(1,Math.round(c.height/2))},He=x.get("assemblyBlurQuarter",me.width,me.height,{linear:!0}),It=x.get("assemblyBlurHalf",me.width,me.height,{linear:!0}),ua=x.get("assemblyBlurFull",me.width,me.height,{linear:!0}),ca=x.get("assemblyBlurTemp",me.width,me.height,{linear:!0}),or=q*me.width/Math.max(1,o);I.copy(_.texture,He),I.render(He.texture,ca,He,or*.25/.45,me),I.render(He.texture,ca,It,Math.sqrt(3)/4*or/.45,me);let vn=or*(Math.sqrt(3)/2/Math.SQRT2)/.45;I.render(It.texture,ca,ua,vn,me),I.render(ua.texture,ca,ua,vn,me),Je=He.texture,St=It.texture,Qe=ua.texture}F.render(B,_.texture,Je,St,Qe,{blockCols:J,blockRows:ue,progress:pe,spread:K,flight:st,spawnDist:1.6,scatter:[W.scatterPx/Math.max(1,o),W.scatterPx/Math.max(1,l)],angleJitter:W.angleJitterDeg*Math.PI/180,sigmaUv:[q/Math.max(1,o),q/Math.max(1,l)],blurStart:re})},dispose:()=>{F.dispose(),I.dispose()}})}else if(Pe&&p.reveal.type==="water"){let F=ph(i,y),I=Zs(i,y),_=!1,B=!1;sa=()=>B,Le.push({name:"waterRevealField",render:()=>{let W=p.reveal.water,q=Math.max(1,W.durationMs),re=Math.max(0,W.settleMs),ne=Oe(),pe=Math.min(1,Math.max(0,ne/q)),oe=re<=0?+(pe>=1):Math.min(1,Math.max(0,(ne-q)/re));if(pe>=1&&oe>=1){_||=(F.release(),!0),B=!1;return}B=!0;let j=x.get("field",c.width,c.height,{linear:!0}),Z=x.get("revealedField",c.width,c.height,{linear:!0}),Ue=1-oe*oe*(3-2*oe);_=!1,F.tick({elapsedMs:ne,sweepT:pe,displayWidth:o,displayHeight:l,rows:W.rows,wobble:W.wobble,intensity:W.intensity,softness:W.softness}),I.render(Z,j.texture,F.current(),{refraction:W.refraction,whiteK:3,glow:fh,fade:Ue})},dispose:()=>{F.dispose(),I.dispose()}})}else if(Pe&&p.reveal.type==="custom"&&r?.customReveal){let F=r.customReveal({gl:i,quad:y,pool:x});Le.push({name:"customRevealField",render:()=>{let I=x.get("field",c.width,c.height,{linear:!0}),_=x.get("revealedField",c.width,c.height,{linear:!0}),B=qe(p.reveal),W=Oe()/B;F.render({field:I,revealed:_,progress:W,fieldSize:c,cssW:o,cssH:l,now:a.now()})},dispose:()=>F.dispose()})}else if(Pe){let F=Is(i,y),I=!1;sa=()=>I,Le.push({name:"revealField",render:()=>{let{cols:_,rows:B}=g,W=qe(p.reveal),q=Oe()/W,re=oh(p.reveal.wave.durationMs);if(q>=1+Math.max(0,p.reveal.wave.softness)+re+p.reveal.wave.waviness*.5+.001){I=!1;return}I=!0;let ne=x.get("field",c.width,c.height,{linear:!0}),pe=x.get("revealedField",c.width,c.height,{linear:!0}),[oe,j]=nh(p.reveal.wave.position),Z=Math.max(Math.hypot(oe,j),Math.hypot(1-oe,j),Math.hypot(oe,1-j),Math.hypot(1-oe,1-j),1e-4);F.render(pe,ne.texture,_,B,{revealMode:1,origin:[oe,j],maxDist:Z,progress:q,softness:p.reveal.wave.softness,waviness:p.reveal.wave.waviness,bandRamp:re})},dispose:()=>F.dispose()})}Le.length>0&&le.push({field:"revealedField",color:null,active:sa});let Ja=[];if(r?.fieldPass){let F=r.fieldPass({gl:i,quad:y,pool:x}),I=le.length;Ja.push({name:"hookField",render:()=>{let _=x.get(Fe(I),c.width,c.height,{linear:!0}),B=x.get("hookField",c.width,c.height,{linear:!0});F.render({input:_,output:B,fieldSize:c,cssW:o,cssH:l,now:a.now(),elapsed:a.now()-n,cursor:$r})},dispose:()=>F.dispose()}),le.push({field:"hookField",color:null,active:bt})}let Qa=[],pn=p.cursorTrail.enabled&&p.cursorTrail.type==="default",mn=p.clickWave.enabled&&p.clickWave.type==="default";if(pn||mn){let F=pn,I=mn,_=F?wc(i):null,B=I?mi(i):null,W=gi(i,y),q=Tc(i,y),re=le.length,ne=!1,pe=()=>!F&&xt.waves.length===0&&xt.clearFramesRemaining===0;Qa.push({name:"cursorField",render:()=>{let oe=a.now()-Lt;if(Lt=a.now(),pe()){ne=!1;return}ne=!0;let{cols:j,rows:Z}=g,Ue=j/Math.max(1,o),st=F?Math.min(mh,p.cursorTrail.pushStrengthPx*Ue):0,K=I?Math.min(6,p.clickWave.pushStrengthPx*Ue):0,$=Math.max(st,K),J=x.get("cursorAccum",j,Z,{float:!0});if(X(i,J),i.clearColor(0,0,0,0),i.clear(i.COLOR_BUFFER_BIT),_){let{samples:Qe}=wd(Ne,oe,p.cursorTrail),me=p.cursorTrail.pushStrengthPx*j/Math.max(1,o);_.render(J,Qe,{cols:j,rows:Z,displayWidth:o,displayHeight:l,pushRadiusScale:p.cursorTrail.pushRadiusScale,pushScale:me})}if(B){let{samples:Qe}=fu(xt,oe,p.clickWave),me=p.clickWave.pushStrengthPx*j/Math.max(1,o);B.render(J,Qe,{cols:j,rows:Z,displayWidth:o,displayHeight:l,pushScale:me,pushBandScale:p.clickWave.pushBandScale,stripeWhiteAlpha:p.clickWave.stripeWhiteAlpha})}let ue=x.get("cursorTear",j,Z);W.render(ue,J.texture,{cols:j,rows:Z,pushCap:$});let xe={cols:j,rows:Z,cellW:o/Math.max(1,j),cellH:l/Math.max(1,Z),pixelW:o,pixelH:l,pushCap:$},Je=x.get(Fe(re),c.width,c.height,{linear:!0}).texture,St=x.get("cursorField",c.width,c.height,{linear:!0});if(q.render(St,Je,J.texture,ue.texture,xe),P){let Qe=x.get(fn(re),c.width,c.height,{linear:!0}).texture,me=x.get("cursorFieldColor",c.width,c.height,{linear:!0}),He=it[0],It=He?[He.r/255,He.g/255,He.b/255]:[1,.5,.2];q.renderColor(me,Qe,J.texture,ue.texture,xe,It)}},dispose:()=>{_?.dispose(),B?.dispose(),W.dispose(),q.dispose()}}),le.push({field:"cursorField",color:P?"cursorFieldColor":null,active:()=>ne})}let Za=[];if(Kr()){let F=Jc(i,y,Gn(p.cursorTrail.constellation)),I=le.length;Za.push({name:"constellationField",render:()=>{let _=x.get(Fe(I),c.width,c.height,{linear:!0}).texture,B=x.get("constellationField",c.width,c.height,{linear:!0});F.render(B,_,{config:p.cursorTrail.constellation,cursor:Ne.target,cssW:o,cssH:l,now:a.now(),timeSec:(a.now()-n)*.001})},dispose:()=>F.dispose()}),le.push({field:"constellationField",color:null,active:bt})}let er=[];if(Qr()){let F=Ff(i,y,eo(p.cursorTrail.comet)),I=le.length;er.push({name:"cometField",render:()=>{let _=x.get(Fe(I),c.width,c.height,{linear:!0}).texture,B=x.get("cometField",c.width,c.height,{linear:!0});F.render(B,_,{config:p.cursorTrail.comet,cursor:Ne.target,cssW:o,cssH:l,now:a.now(),timeSec:(a.now()-n)*.001})},dispose:()=>F.dispose()}),le.push({field:"cometField",color:null,active:bt})}let tr=[];if(p.background.meteors.enabled){let F=Vf(i,y,ao(p.background.meteors)),I=le.length;tr.push({name:"meteorsField",render:()=>{let _=x.get(Fe(I),c.width,c.height,{linear:!0}).texture,B=x.get("meteorsField",c.width,c.height,{linear:!0});F.render(B,_,{config:p.background.meteors,cssW:o,cssH:l,timeSec:(a.now()-n)*.001})},dispose:()=>F.dispose()}),le.push({field:"meteorsField",color:null,active:bt})}let ar=[];if(Na()){let F=td(i,y,sr(p.clickWave.detonation)),I=le.length;ar.push({name:"detonationField",render:()=>{let _=x.get(Fe(I),c.width,c.height,{linear:!0}).texture,B=x.get("detonationField",c.width,c.height,{linear:!0});F.render(B,_,{config:p.clickWave.detonation,state:an(),cssW:o,cssH:l,timeSec:(a.now()-n)*.001})},dispose:()=>F.dispose()}),le.push({field:"detonationField",color:null,active:bt})}let rr=[];if(p.clickWave.enabled&&ct(p.clickWave.type)){let F=p.clickWave.type,I=lo(i,y,F,"click",$t(F,p.clickWave[F])),_=le.length,B=!1;rr.push({name:`${F}ClickField`,render:()=>{if(B=!1,!Xe||!w||o<=0||l<=0)return;let W=p.clickWave[F],q=bd(Xe,At*1e3,W.durationMs);if(q===0||W.intensity===0)return;let re=x.get(Fe(_),c.width,c.height,{linear:!0}).texture,ne=x.get("physicalClickField",c.width,c.height,{linear:!0});I.render(ne,re,{config:W,cssW:o,cssH:l,count:q,events:Xe.packed}),B=!0},dispose:()=>I.dispose()}),le.push({field:"physicalClickField",color:null,active:()=>B})}let ze=r?.postPass?r.postPass({gl:i,quad:y,pool:x}):null,gn=()=>({outputWidth:f.width,outputHeight:f.height,cssW:o,cssH:l,now:a.now(),elapsed:a.now()-n,cursor:$r}),nr=p.colors.mode==="colors";if(p.stripesEnabled){let F=Fs(i,y),I=nr?Us(i,y):null,_=I?[{name:"downsampleColor",render:()=>{let{cols:K,rows:$}=g,J=x.get(hn(),c.width,c.height,{linear:!0}),ue=x.get("cellColor",K,$);I.render(ue,J.texture,K,$)},dispose:()=>I.dispose()}]:[],B=ru(i,y),W=p.renderMode==="sharp"?null:Bu(i,y),q=W?_u(i,y):null,re=p.letters.enabled,ne=re?Gu(i,y):null,pe=ne?[{name:"letterData",render:()=>{let{cols:K,rows:$}=g;if(p.letters.mode==="text"){sn(K,$);return}let J=x.get("cell",K,$),ue=x.get("glyphData",K,$),xe=Math.max(...ga(p).map(Je=>Je.startFrom));ne.render(ue,J.texture,{cols:K,rows:$,topBandThreshold:xe,coverage:p.letters.coverage,timeSec:a.now()/1e3,charsetLen:Ou,shuffleSpeed:p.letters.shuffleSpeed,positionX:p.letters.positionX,positionY:p.letters.positionY,areaWidth:p.letters.areaWidth,areaHeight:p.letters.areaHeight})},dispose:()=>ne.dispose()}]:[],oe=(K,$,J)=>{let{cols:ue,rows:xe}=g,Je=Qt(),St=re&&p.letters.mode==="text"?sn(ue,xe):re?x.get("glyphData",ue,xe).texture:We.dummyTex;return{cols:ue,rows:xe,displayW:o,displayH:l,dpr:ra(),timeSec:K,lettersEnabled:re,colorsMode:nr,glyphDataTex:St,atlasTex:We.atlasTex,atlasGrid:We.atlasGrid,cellColorTex:nr?x.get("cellColor",ue,xe).texture:We.dummyTex,opacityTex:Ie,bandValueTex:_e,stripeBandCount:Et,contourFieldTex:Je?.resource??null,contourMinCssPx:Math.min(o,l),cellDataA:$,cellDataB:J}},j=i.getExtension("EXT_color_buffer_float")?ou(i,y):null;j&&(ot=xr(i));let Z=()=>{let{cols:K,rows:$}=g;return[x.get("cellDataA",K,$,{float32:!0}),x.get("cellDataB",K,$,{float32:!0})]},Ue=j?[{name:"stripeCell",render:()=>{let{cols:K,rows:$}=g,[J,ue]=Z();j.render(ot,J,ue,x.get("cell",K,$).texture,Re,Tn(p,oe(At,null,null)))},dispose:()=>j.dispose()}]:[],st=()=>{let{cols:K,rows:$}=g,J=x.get(dn(),c.width,c.height,{linear:!0}),ue=x.get("cell",K,$);F.render(ue,J.texture,K,$)};ee=j?()=>{let K=U,$=E;!K||!$||(Se(),Yi(K,()=>{k.render();for(let J of ge)J.render();for(let J of Ae)J.render();st();for(let J of _)J.render();for(let J of Ue)J.render();$.captureLive(Z())}))}:null,T=[k,...ge,...Ae,...Le,...Ja,...Qa,...Za,...er,...tr,...ar,...rr,{name:"downsample",render:st,dispose:()=>F.dispose()},..._,...pe,...Ue,{name:"stripe",render:()=>{let{cols:K,rows:$}=g,J=x.get("cell",K,$),ue=j?Z():null,xe=ue&&E?E.render(ue,a.now(),o,l):ue;B.render(J.texture,Re,Tn(p,oe(At,xe?xe[0].texture:null,xe?xe[1].texture:null)),f.width,f.height,W||ze?x.get("stripeOut",f.width,f.height,{linear:!0}):null,v,M),D=Ee?null:xe,L=Ee?null:p},dispose:()=>B.dispose()},...W?[{name:"logoFill",render:()=>{let K=x.get("stripeOut",f.width,f.height,{linear:!0}),$=x.get("solidOut",f.width,f.height,{linear:!0});q.render($,K.texture,{resolution:[f.width,f.height],bg:p.background.color})},dispose:()=>q.dispose()}]:[],...W?[{name:"stylize",render:()=>{let K=x.get("solidOut",f.width,f.height,{linear:!0}),$=x.get("stripeOut",f.width,f.height,{linear:!0}),J=ze?x.get("postSrc",f.width,f.height,{linear:!0}):null;W.render(J,K.texture,$.texture,{mode:p.renderMode,time:a.now()/1e3,intensity:p.renderIntensity,resolution:[f.width,f.height],dpr:ra(),params:p.renderParams,colorA:p.renderColorA,colorB:p.renderColorB},v,M)},dispose:()=>W.dispose()}]:[],...ze?[{name:"hookPost",render:()=>{let K=W?"postSrc":"stripeOut",$=x.get(K,f.width,f.height,{linear:!0});ze.render($.texture,null,gn())},dispose:()=>ze.dispose()}]:[]]}else{let F=ze?null:Ds(i,y);T=[k,...ge,...Ae,...Le,...Ja,...Qa,...Za,...er,...tr,...ar,...rr,{name:ze?"hookPost":"present",render:()=>{let I=P?hn():dn(),_=x.get(I,c.width,c.height,{linear:!0}).texture;if(ze)ze.render(_,null,gn());else{let B=Qt();F.render(_,f.width,f.height,p.edgeMask,fi(p)!=="none",B?.resource??null,Math.min(o,l),v,M)}D=null,L=p},dispose:()=>{F?.dispose(),ze?.dispose()}}]}}function Bt(){let P=ra();f=xs(o,l,P,u),e.applyOutputSize(f.width,f.height);let k=E0(o,l,p.grid.cellWidth,p.grid.cellHeight);if(Ee||Ge.setGridSize(null,k.cols,k.rows),g=k,m=bs(f,p.fieldScale),c=p.stripesEnabled&&!r?.fieldPass?Ss(m,g.cols,g.rows,4):m,x.get("field",c.width,c.height,{linear:!0}),x.get("cell",g.cols,g.rows),p.renderMode!=="sharp"&&(x.get("stripeOut",f.width,f.height,{linear:!0}),x.get("solidOut",f.width,f.height,{linear:!0})),p.reveal.enabled&&(x.get("revealedField",c.width,c.height,{linear:!0}),p.reveal.type==="assembly")){let z=Math.max(1,Math.round(c.width/2)),N=Math.max(1,Math.round(c.height/2));x.get("assemblyBlurQuarter",z,N,{linear:!0}),x.get("assemblyBlurHalf",z,N,{linear:!0}),x.get("assemblyBlurFull",z,N,{linear:!0}),x.get("assemblyBlurTemp",z,N,{linear:!0})}Qt()}function un(P){Ge.abandon(),mt.abandon();let k=P??e.acquireContext();i=k.gl,s=k.isP3,u=k.maxTextureSize,y=Cn(i),x=wo(i),R=Mo(i,S),Ge=Do(()=>ko(i)),mt=In(i),w=null,E=null,D=null,L=null,H=!1,U=null,Re=null,Ie=null,_e=null,Aa="",We.reset(i),vt=null,ot=null,kt=Ro(i,y),Dt=Eo(i,y),Ft=hr(ht(ea)),ta=lr(ht(Wa)),Ne=fr(),xt=ir(),Ut=null,aa="",Xe=null,De=null,Lt=a.now(),Ya(),We.ensureAtlas(p.letters.fontFamily),ia(),Bt()}function Ki(P){P.preventDefault(),pt=!0,Ge.abandon(),mt.abandon()}function Ji(){pt=!1,un()}e.attachContextLossListeners(Ki,Ji),kt=Ro(i,y),Dt=Eo(i,y),Ya(),We.ensureAtlas(p.letters.fontFamily),ia(),Bt();function Qi(P){if(E?.active){H||=(Ge.reset(),!0);return}H=!1;let{cols:k,rows:z}=g,N=Qt();Ge.update(Ee?.id??null,{config:p,cols:k,rows:z,valuesFbo:()=>x.get("cell",k,z).fbo,settled:w!==null&&_a(),nowMs:P,timeSec:At,cursor:Ga,cssWidth:o,cssHeight:l,dpr:ra(),contourField:N?.field??null})}function cn(){if(pt)return;let P=a.now();if(At=P/1e3,we++,R.poll(),Vi(),U&&ee){R.begin("cellSwitchOutgoing");try{ee()}finally{R.end()}}if(P0(T,R),p.reveal.enabled&&(!w||!nt.gateOpen&&Oe()<=0)){let z=i.isEnabled(i.SCISSOR_TEST),N=i.getParameter(i.SCISSOR_BOX),te=i.getParameter(i.COLOR_CLEAR_VALUE);i.bindFramebuffer(i.FRAMEBUFFER,null),i.enable(i.SCISSOR_TEST),i.scissor(v,M,f.width,f.height),i.clearColor(0,0,0,0),i.clear(i.COLOR_BUFFER_BIT),i.clearColor(te[0],te[1],te[2],te[3]),i.scissor(N[0],N[1],N[2],N[3]),z||i.disable(i.SCISSOR_TEST),D=null,L=null}b=ws(),U&&!E?.active&&Ka(),Qi(P),i.flush();let k=a.now()-ka;ka=P,C.recordFrame(k),C.recordPasses(R.latest())}let la=us({supportsRaf:e.supportsRaf,frame:()=>{(fs(Oi,p.maxFps,a.now())||zi())&&cn()},onStart:()=>{ka=a.now()},settle:Ni,teardown:()=>{e.detachContextLossListeners();for(let P of T)P.dispose();vt&&=(vt.dispose(),null),ot&&=(ot.dispose(),null),kt?.dispose(),Dt?.dispose(),De?.dispose(),De=null,Ge.reset(),mt.clear(),Jt.clear(),Ee=null,x.dispose(),y.dispose(),w?.dispose(),E?.dispose(),E=null,Ka(),D=null,L=null,Re&&=(i.deleteTexture(Re),null),Ie&&=(i.deleteTexture(Ie),null),_e&&=(i.deleteTexture(_e),null),We.dispose()}});return{get isP3(){return s},get maxFps(){return p.maxFps},get outputWidth(){return f.width},get outputHeight(){return f.height},get fieldWidth(){return c.width},get fieldHeight(){return c.height},get fieldScale(){return p.fieldScale},get passFill(){return b},resize(P,k){o=P,l=k,Bt(),p.colors.mode==="colors"&&na()!==Zt&&oa()},setDpr(P){e.setDpr(P),Bt(),p.colors.mode==="colors"&&na()!==Zt&&oa()},rebuild(P){pt=!1,un(P)},setFieldScale(P){this.setConfig({fieldScale:P})},setSource(P,k,z){let N=P?R0(i,P):null,te=z?Ke({...p,...z}):p,he=w!==null,ae=L,ge=!1;N&&k&&D&&ae&&En(ae,te)&&!r&&!Ee?(E??=bu(i,y),E.capture(D,k,te.grid,o,l),ge=E.liveOutgoing&&ee!==null&&xu(ae,te)&&_a()):E?.cancel(),Ka(),ge&&ae?U=$i(ae):w?.dispose(),w=N,gt=P?qi(P):te.colors.backgroundColor,ji(P),z&&this.setConfig(z),w&&!he&&nt.trigger(),oa(),p.colors.mode==="colors"&&ia()},updateSourceFrame(P){if(!pt){if(!w){this.setSource(P);return}w.uploadFrame(P)}},setConfig(P){let k=Ke({...p,...P});E?.active&&L&&!En(L,k)&&E.cancel(),p=k,on(),Ya(),We.ensureAtlas(p.letters.fontFamily),Bt(),p.colors.mode==="colors"&&na()!==Zt&&oa();let z=Vr();p.flames.enabled&&(!Fa||z!==Nr)&&(Ft=hr(ht(ea))),Nr=z,(p.stripesEnabled!==zr||Da()!==Hr||p.flames.enabled!==Fa||p.renderMode!==Xr||p.cursorTrail.enabled!==La||p.cursorTrail.type!==Yr||za()!==Jr||Ha()!==Zr||p.clickWave.enabled!==Ua||p.clickWave.type!==Ba||Xa()!==tn||qa()!==rn||ja()!==nn||p.letters.enabled!==qr||p.colors.mode!==jr||p.background.stars.enabled!==Ia||Va()!==en)&&(p.background.stars.enabled&&!Ia&&(ta=lr(ht(Wa))),p.cursorTrail.enabled&&!La&&(Ne=fr(),Lt=a.now()),(p.clickWave.enabled!==Ua||p.clickWave.type!==Ba)&&(xt=ir(),Ut=null,aa="",Lt=a.now()),ia(),zr=p.stripesEnabled,Hr=Da(),Fa=p.flames.enabled,Xr=p.renderMode,La=p.cursorTrail.enabled,Yr=p.cursorTrail.type,Jr=za(),Zr=Ha(),Ua=p.clickWave.enabled,Ba=p.clickWave.type,tn=Xa(),rn=qa(),nn=ja(),qr=p.letters.enabled,jr=p.colors.mode,Ia=p.background.stars.enabled,en=Va())},setSurfaceSliceContext(P){let k=Br(P);if(!k){Ee=null;return}let z=Ir(k.points),N=Jt.get(k.id);N!==void 0&&N!==z&&Ge.release(k.id),Jt.set(k.id,z),Ee=k},releaseSurfaceSliceContext(P){Ge.release(P),mt.release(P),Jt.delete(P),Ee?.id===P&&(Ee=null)},setCursor(P,k){P===null?(Ga=null,so(Ne,null)):(Ga={x:P,y:k??0},so(Ne,{x:P,y:k??0}))},click(P,k){if(p.clickWave.enabled){if(ct(p.clickWave.type)){if(!w||o<=0||l<=0)return;on(),xd(Xe,P/Math.max(1,o),(k??0)/Math.max(1,l));return}if(Na()){Qf(an(),p.clickWave.detonation,P,k??0,(a.now()-n)*.001);return}cu(xt,{x:P,y:k??0},p.clickWave.lifeMs)}},triggerReveal(){nt.trigger(),Xe&&vd(Xe)},setRevealGate(P){nt.setGate(P)},renderFrame:cn,setPresentOrigin(P,k){v=P,M=k},start:la.start,stop:la.stop,settle:la.settle,readOutputPixels(){let P=new Uint8Array(f.width*f.height*4);return i.bindFramebuffer(i.FRAMEBUFFER,null),i.readPixels(0,0,f.width,f.height,i.RGBA,i.UNSIGNED_BYTE,P),P},readCellGrid(){let{cols:P,rows:k}=g,z=x.get("cell",P,k),N=new Uint8Array(P*k*4);i.bindFramebuffer(i.FRAMEBUFFER,z.fbo),i.readPixels(0,0,P,k,i.RGBA,i.UNSIGNED_BYTE,N);let te=new Uint8Array(P*k);for(let ae=0;ae<P*k;ae++)te[ae]=N[ae*4];let he=null;if(p.colors.mode==="colors"){let ae=x.get("cellColor",P,k);he=new Uint8Array(P*k*4),i.bindFramebuffer(i.FRAMEBUFFER,ae.fbo),i.readPixels(0,0,P,k,i.RGBA,i.UNSIGNED_BYTE,he)}return i.bindFramebuffer(i.FRAMEBUFFER,null),{cols:P,rows:k,values:te,colors:he}},readFramesOverlay(){return!w||!_a()||E?.active?null:Ge.read(Ee?.id??null)},getPerf(){return C.snapshot()},getWaterActivity(){return De?.activity()??0},dispose:la.dispose}}function Zh(e,t){if(t.length===0)return 0;let a=[...t].sort((n,o)=>n.startFrom-o.startFrom),r=-1;for(let n=0;n<a.length;n++)a[n].startFrom<=e&&(r=n);return r+1}function ep(e,t,a){if(!a.enabled)return 1;let r=a.start,n=Math.max(a.end,r+1e-4),o=(l,i)=>i?Math.min(1,Math.max(0,(l-r)/(n-r)))**a.power:1;return o(e,a.sides.left)*o(1-e,a.sides.right)*o(t,a.sides.bottom)*o(1-t,a.sides.top)}function tp(e){return JSON.stringify(e)}function ap(e){return Ke(JSON.parse(e))}function Gt(e){return typeof e=="object"&&!!e&&!Array.isArray(e)}function xh(e,t){if(!e.enabled)return t?{enabled:!1}:void 0;let a={enabled:!0,type:e.type};return e.type==="wave"?{...a,wave:{...e.wave}}:e.type==="assembly"?{...a,assembly:{...e.assembly}}:e.type==="turbulence"?{...a,turbulence:{...e.turbulence}}:e.type==="glitch"?{...a,glitch:{...e.glitch}}:e.type==="vortex"?{...a,vortex:{...e.vortex}}:e.type==="blackhole"?{...a,blackhole:{...e.blackhole}}:e.type==="whirlpool"?{...a,whirlpool:{...e.whirlpool}}:e.type==="water"?{...a,water:{...e.water}}:e.type==="supernova"?{...a,supernova:{...e.supernova}}:e.type==="tidal"?{...a,tidal:{...e.tidal}}:e.type==="magma"?{...a,magma:{...e.magma}}:a}function Io(e,t){let a=e.stripesEnabled,r={color:e.background.color,transparent:e.background.transparent};a&&!e.background.transparent&&(e.background.gradient.enabled?r.gradient={...e.background.gradient,stops:[...e.background.gradient.stops]}:t&&(r.gradient={enabled:!1}),e.background.grid.enabled?r.grid={...e.background.grid}:t&&(r.grid={enabled:!1})),e.background.stars.enabled?r.stars={...e.background.stars}:t&&(r.stars={enabled:!1}),e.background.meteors.enabled?r.meteors={...e.background.meteors}:t&&(r.meteors={enabled:!1});let n={transform:{...e.transform},adjustments:{...e.adjustments},background:r,stripesEnabled:e.stripesEnabled,fieldScale:e.fieldScale,maxFps:e.maxFps};if(a){let{streamGapWave:l,...i}=e.grid;n.grid={...i,...l.enabled?{streamGapWave:{...l}}:t?{streamGapWave:{enabled:!1}}:{}},n.stripes=e.stripes.map(u=>({...u}));let s={};for(let u of["gaps","width","stripe","motion"]){let f=e.sparkle[u];f.enabled?s[u]={...f}:t&&(s[u]={enabled:!1})}Object.keys(s).length>0&&(n.sparkle=s),e.stripeDots.enabled?n.stripeDots={...e.stripeDots}:t&&(n.stripeDots={enabled:!1}),e.stripeBorder.enabled?n.stripeBorder={...e.stripeBorder}:t&&(n.stripeBorder={enabled:!1}),e.gridLines.enabled?n.gridLines={...e.gridLines}:t&&(n.gridLines={enabled:!1}),e.frames.enabled?n.frames={...e.frames,connection:{...e.frames.connection}}:t&&(n.frames={enabled:!1}),e.letters.enabled?n.letters={...e.letters}:t&&(n.letters={enabled:!1}),e.renderMode==="sharp"?t&&(n.renderMode="sharp"):(n.renderMode=e.renderMode,n.renderIntensity=e.renderIntensity,n.renderParams=[...e.renderParams],n.renderColorA=e.renderColorA,n.renderColorB=e.renderColorB)}let o=xh(e.reveal,t);if(o&&(n.reveal=o),e.flames.enabled){let{vortexSingular:l,...i}=e.flames;n.flames=e.flames.direction==="vortexSingular"?{...i,vortexSingular:{...l}}:i}else t&&(n.flames={enabled:!1});if(e.edgeMask.enabled?n.edgeMask={...e.edgeMask,sides:{...e.edgeMask.sides}}:t&&(n.edgeMask={enabled:!1}),e.cursorTrail.enabled){let{constellation:l,comet:i,...s}=e.cursorTrail;e.cursorTrail.type==="default"?n.cursorTrail=s:e.cursorTrail.type==="constellation"?n.cursorTrail={enabled:!0,type:"constellation",constellation:{...l}}:e.cursorTrail.type==="comet"?n.cursorTrail={enabled:!0,type:"comet",comet:{...i}}:n.cursorTrail={enabled:!0,type:"wave"}}else t&&(n.cursorTrail={enabled:!1});if(e.clickWave.enabled){let{detonation:l,supernova:i,tidal:s,magma:u,...f}=e.clickWave;e.clickWave.type==="detonation"?n.clickWave={enabled:!0,type:"detonation",detonation:{...l}}:e.clickWave.type==="supernova"?n.clickWave={enabled:!0,type:"supernova",supernova:{...i}}:e.clickWave.type==="tidal"?n.clickWave={enabled:!0,type:"tidal",tidal:{...s}}:e.clickWave.type==="magma"?n.clickWave={enabled:!0,type:"magma",magma:{...u}}:n.clickWave=f}else t&&(n.clickWave={enabled:!1});if(e.colors.mode==="colors"){let{gradient:l,...i}=e.colors;n.colors={...i,...a&&l.enabled?{gradient:{...l,stops:[...l.stops]}}:t&&a?{gradient:{enabled:!1}}:{}}}else t&&(n.colors={mode:"luminance"});return n}function Ui(e,t){if(!Gt(e)||!Gt(t))return e;let a={};for(let r of Object.keys(t)){if(!(r in e))continue;let n=e[r],o=t[r],l=Gt(n)&&Gt(o)?Ui(n,o):n;(!Gt(l)||Object.keys(l).length>0)&&(a[r]=l)}return a}function bh(e){let t=Io(Ke(xa(e,"light")),!1);if(!e.dark)return t;let a=Ke(xa(e,"dark")),r=Ui(ni(Ke(t),a),Io(a,!0));return Object.keys(r).length>0?{...t,dark:r}:t}function rp(e){return`${JSON.stringify(bh(e),null,2)}
`}function Ot(e){return e&&typeof e=="object"&&!Array.isArray(e)?e:null}function Sh(e){return parseInt(e.replace(/^#/,""),16)||0}function yh(e){return{color:typeof e.color=="number"?e.color:typeof e.hex=="string"?Sh(e.hex):0,startFrom:typeof e.startFrom=="number"?e.startFrom:0,width:typeof e.width=="number"?e.width:1,opacity:1}}function Mh(e){let t=e.wave??{},a=e.assembly??{};return{enabled:typeof e.enabled=="boolean"?e.enabled:!1,type:e.type==="assembly"?"assembly":"wave",wave:{position:t.position??"center",durationMs:typeof t.durationMs=="number"?t.durationMs:1200,softness:typeof t.softness=="number"?t.softness:.22,waviness:typeof t.waviness=="number"?t.waviness:.11},assembly:{sliceSizePx:40,speedMinMs:typeof a.speedMinMs=="number"?a.speedMinMs:300,speedMaxMs:typeof a.speedMaxMs=="number"?a.speedMaxMs:1600,staggerMs:typeof a.staggerMs=="number"?a.staggerMs:900,scatterPx:50,angleJitterDeg:22,blurPx:8,blurStart:0},turbulence:{...Y.turbulence},glitch:{...Y.glitch},vortex:{...Y.vortex},blackhole:{...Y.blackhole},whirlpool:{...Y.whirlpool},water:{...Y.water},supernova:{...Y.supernova},tidal:{...Y.tidal},magma:{...Y.magma}}}function np(e){let t=Ot(e);if(!t)return{};let a={};return Ot(t.textureAdjustments)&&(a.adjustments=t.textureAdjustments),Ot(t.sourceTransform)&&(a.transform=t.sourceTransform),Ot(t.grid)&&(a.grid=t.grid),typeof t.backgroundColor=="number"&&(a.background=Ho({color:t.backgroundColor,transparent:!1})),Array.isArray(t.stripes)&&(a.stripes=t.stripes.map(yh)),typeof t.stripesEnabled=="boolean"&&(a.stripesEnabled=t.stripesEnabled),Ot(t.reveal)&&(a.reveal=Mh(t.reveal)),a}var wh=1.1,Ph=1.1,Ch=.1;function Th(e,t=1.18,a=.45){return e*t+a}function Rh(e=0){return{fieldTimeSec:e,formation:0,formationVelocity:0,mode:"field",rejoinProgress:0,rejoinStartFieldTimeSec:e,rejoinStartFormation:0,rejoinStartFormationVelocity:0,hovered:!1,lastTimeSec:null}}function Eh(e,t,a,r=wh,n=Ph,o=1.18,l=2,i=.45){if(e.lastTimeSec===null)return{fieldTimeSec:t,formation:e.formation,formationVelocity:0,mode:a?"forming":e.mode,rejoinProgress:e.rejoinProgress,rejoinStartFieldTimeSec:e.rejoinStartFieldTimeSec,rejoinStartFormation:e.rejoinStartFormation,rejoinStartFormationVelocity:e.rejoinStartFormationVelocity,hovered:a,lastTimeSec:t};if(t<e.lastTimeSec)return{fieldTimeSec:t,formation:0,formationVelocity:0,mode:a?"forming":"field",rejoinProgress:0,rejoinStartFieldTimeSec:t,rejoinStartFormation:0,rejoinStartFormationVelocity:0,hovered:a,lastTimeSec:t};let s=Math.max(0,Math.min(.1,t-e.lastTimeSec)),u=e.mode,f=e.formation,c=0,m=e.rejoinProgress,g=e.rejoinStartFieldTimeSec,b=e.rejoinStartFormation,S=e.rejoinStartFormationVelocity;if(u==="field"&&a&&(u="forming"),u==="forming")!a&&f<=Ch?(u="field",f=0,c=0,m=0,g=t,b=0,S=0):!a&&f>0?(u="rejoining",m=0,g=t,b=f,S=e.formationVelocity):(f=Math.min(1,f+s/Math.max(r,.001)),f>.999999&&(f=1),c=s>0?(f-e.formation)/s:0,f===1&&(u="logo"));else if(u==="logo"&&!a)u="rejoining",m=0,g=t,b=1,S=0;else if(u==="rejoining"){let v=Th(Math.max(n,.001),o,i);if(a&&l===0)u="forming",f=0,c=0,m=0;else if(a&&l===1){g+=5*s;let M=t-g;M<=0?(u="forming",f=Math.max(0,Math.min(1,b)),c=0,m=0,g=t):m=Math.min(1,M/v)}else m=Math.min(1,Math.max(0,t-g)/v),m>.999999&&(m=1),m===1&&(f=0,c=0,m=0,u=a?"forming":"field")}return{fieldTimeSec:t,formation:f,formationVelocity:c,mode:u,rejoinProgress:m,rejoinStartFieldTimeSec:g,rejoinStartFormation:b,rejoinStartFormationVelocity:S,hovered:a,lastTimeSec:t}}var Wr=[[.70846,.1109],[.7797,.10436],[.84864,.08538],[.9131,.0544],[.97098,.01237],[1.02035,-.0394],[1.05977,-.09907],[1.08794,-.1648],[1.10398,-.2345],[1.10719,-.30598],[1.09768,-.37688],[1.0756,-.44492],[1.03048,-.48776],[.95885,-.48776],[.88722,-.48776],[.81559,-.48776],[.74396,-.48776],[.67233,-.48776],[.60069,-.48776],[.52906,-.48776],[.47223,-.47794],[.50003,-.41192],[.53126,-.3476],[.57775,-.29338],[.63607,-.2521],[.70271,-.22639],[.77376,-.21803],[.84518,-.21254],[.91551,-.20349],[.87366,-.17114],[.80226,-.16535],[.73117,-.15737],[.66909,-.12349],[.63731,-.06056],[.64244,.01031],[.65954,.07987],[.13193,.4878],[.20307,.4829],[.27299,.46886],[.34029,.44528],[.40386,.41299],[.46259,.37254],[.51526,.32447],[.56119,.26992],[.59947,.20975],[.62918,.14493],[.61211,.07865],[.5854,.01247],[.55084,-.04966],[.50022,-.09968],[.43856,-.13522],[.3696,-.15252],[.29827,-.15469],[.22692,-.15645],[.15557,-.15821],[.08422,-.15996],[.01287,-.16172],[-.05848,-.16348],[-.12983,-.16524],[-.20118,-.16699],[-.27253,-.16875],[-.34387,-.17051],[-.41522,-.17226],[-.48657,-.17402],[-.55149,-.18834],[-.49281,-.2087],[-.42146,-.21049],[-.35012,-.21228],[-.27877,-.21406],[-.20742,-.21585],[-.13607,-.21763],[-.06472,-.21942],[.00663,-.2212],[.07797,-.22299],[.14932,-.22477],[.22067,-.22656],[.29202,-.22834],[.36312,-.23302],[.42534,-.26588],[.45592,-.32894],[.44843,-.39935],[.43027,-.46837],[.37388,-.4878],[.30251,-.4878],[.23114,-.4878],[.15977,-.4878],[.0884,-.4878],[.01703,-.4878],[-.05434,-.4878],[-.12571,-.4878],[-.19708,-.4878],[-.26845,-.4878],[-.33982,-.4878],[-.41119,-.4878],[-.48256,-.4878],[-.55393,-.4878],[-.6253,-.4878],[-.69668,-.4878],[-.76805,-.4878],[-.83942,-.4878],[-.91079,-.4878],[-.98216,-.4878],[-1.05353,-.4878],[-1.10685,-.46667],[-1.10878,-.39545],[-1.09655,-.32525],[-1.07042,-.25897],[-1.03153,-.19928],[-.98156,-.14852],[-.92251,-.10869],[-.85668,-.08149],[-.78673,-.06809],[-.73273,-.05092],[-.72489,.0198],[-.69867,.08592],[-.65586,.14275],[-.59953,.18622],[-.53367,.21314],[-.46303,.22169],[-.39264,.21127],[-.33561,.20977],[-.29736,.26996],[-.25144,.32452],[-.19868,.37249],[-.14,.413],[-.07644,.4453],[-.0091,.46877],[.06077,.48298]],Ah=Wr.map((e,t)=>t).filter(e=>e<=20||e>=36&&e<=46||e>=79),op=160,ip=8,Pa=3;function Bi(e){let t=1/0,a=-1/0,r=1/0,n=-1/0;for(let[o,l]of e)o<t&&(t=o),o>a&&(a=o),l<r&&(r=l),l>n&&(n=l);return{minX:t,maxX:a,minY:r,maxY:n,width:a-t,height:n-r}}function Gr(e){let t=(e.points??[]).filter(n=>n&&Number.isFinite(n[0])&&Number.isFinite(n[1])).map(([n,o])=>[n,o]);if(t.length<Pa)throw Error(`A comet logo shape needs at least ${Pa} finite points, got ${t.length}.`);let a=e.sparkAnchorIndices,r=a?[...new Set(a.filter(n=>Number.isInteger(n)&&n>=0&&n<t.length))].sort((n,o)=>n-o):[];return{id:typeof e.id=="string"&&e.id.trim()!==""?e.id.trim():"custom",points:t,sparkAnchorIndices:r.length>0?r:t.map((n,o)=>o)}}var Ii=Gr({id:"cloudflare",points:Wr,sparkAnchorIndices:Ah}),kh=Bi(Ii.points).height;function _i(e){let t=e.points.length,a=t+160;return{logo:t,render:a,activeRender:a+96}}function Dh(e,t){return Math.max(1,Math.round(e*t.points.length))}function Fh(e,t){let a=Bi(e),r=a.height>0?t/a.height:1,n=(a.minX+a.maxX)/2,o=(a.minY+a.maxY)/2;return e.map(([l,i])=>[(l-n)*r,(o-i)*r])}function Ca(e){let t=0;for(let a=1;a<e.length;a+=1)t+=Math.hypot(e[a][0]-e[a-1][0],e[a][1]-e[a-1][1]);return t}function Lh(e,t){if(e.length<2||t<1)return e.slice(0,t);let a=Ca(e);if(a<=0)return Array.from({length:t},()=>e[0]);let r=a/t,n=[],o=1,l=0,i=0;for(let s=0;s<t;s+=1){let u=s*r;for(;o<e.length;){let g=Math.hypot(e[o][0]-e[o-1][0],e[o][1]-e[o-1][1]);if(i+g>=u||o===e.length-1){l=g;break}i+=g,o+=1}let f=l>0?Math.min(1,Math.max(0,(u-i)/l)):0,c=e[o-1],m=e[Math.min(e.length-1,o)];n.push([c[0]+(m[0]-c[0])*f,c[1]+(m[1]-c[1])*f])}return n}function Uh(e,t){let a=e.length;if(a===0)return[];let r=Math.max(1,Math.min(3,Math.floor(t/a))),n=e.reduce((i,s)=>i+s,0);if(n<=0)return e.map(()=>Math.max(1,Math.floor(t/a)));let o=e.map(i=>Math.max(r,Math.floor(i/n*t))),l=o.reduce((i,s)=>i+s,0);for(;l>t;){let i=-1;for(let s=0;s<a;s+=1)o[s]<=1||(i<0||o[s]>o[i])&&(i=s);if(i<0)break;--o[i],--l}for(;l<t;){let i=0;for(let s=1;s<a;s+=1)e[s]/o[s]>e[i]/o[i]&&(i=s);o[i]+=1,l+=1}return o}function Ea(e){return Math.max(Pa,Math.round(e.pointCount??Wr.length))}function Or(e,t){let a=e.filter(s=>s.length>=2&&Ca(s)>0);if(a.length===0)throw Error("The comet logo artwork produced no traceable outline.");let r=Ea(t),n=Math.max(1,Math.round(t.sparkAnchorStride??1)),o=Uh(a.map(Ca),r),l=[];for(let s=0;s<a.length;s+=1)o[s]<=0||l.push(...Lh(a[s],o[s]));let i=[];for(let s=0;s<l.length;s+=n)i.push(s);return Gr({id:t.id,points:Fh(l,t.height??kh),sparkAnchorIndices:i})}function Wi(e,t){e.style.position="absolute",e.style.width="0",e.style.height="0",e.style.visibility="hidden",document.body.append(e);try{return t(e)}finally{e.remove()}}function Gi(e,t){let a=[...e.querySelectorAll("path, circle, ellipse, line, polyline, polygon, rect")].map(n=>({element:n,length:n.getTotalLength()})).filter(n=>Number.isFinite(n.length)&&n.length>0);if(a.length===0)throw Error("The comet logo SVG has no geometry with a measurable length.");let r=a.reduce((n,o)=>n+o.length,0);return a.map(n=>{let o=n.element.getCTM(),l=Math.max(16,Math.min(4096,Math.round(n.length/r*t*6))),i=[];for(let s=0;s<l;s+=1){let u=n.element.getPointAtLength(s/l*n.length),f=o?new DOMPoint(u.x,u.y).matrixTransform(o):u;i.push([f.x,f.y])}return i.push(i[0]),i})}function lp(e,t={}){let a=document.createElementNS("http://www.w3.org/2000/svg","svg"),r=document.createElementNS("http://www.w3.org/2000/svg","path");return r.setAttribute("d",e),a.append(r),Or(Wi(a,n=>Gi(n,Ea(t))),t)}function sp(e,t={}){let a=new DOMParser().parseFromString(e,"image/svg+xml");if(a.querySelector("parsererror"))throw Error("The comet logo SVG could not be parsed.");let r=a.documentElement;if(!(r instanceof SVGSVGElement))throw Error("The comet logo file is not an SVG document.");for(let n of r.querySelectorAll("script, foreignObject, image, animate, set"))n.remove();for(let n of[r,...r.querySelectorAll("*")])for(let o of[...n.attributes])o.name.toLowerCase().startsWith("on")&&n.removeAttribute(o.name);return Or(Wi(document.importNode(r,!0),n=>Gi(n,Ea(t))),t)}var Bh=[[],[[3,0]],[[0,1]],[[3,1]],[[1,2]],[],[[0,2]],[[3,2]],[[2,3]],[[0,2]],[],[[1,2]],[[3,1]],[[0,1]],[[3,0]],[]];function Ih(e,t,a,r){let n=[],o=(m,g)=>e[g*t+m],l=(m,g)=>{let b=g-m;return Math.abs(b)<1e-9?.5:Math.min(1,Math.max(0,(r-m)/b))};for(let m=0;m<a-1;m+=1)for(let g=0;g<t-1;g+=1){let b=o(g,m),S=o(g+1,m),v=o(g+1,m+1),M=o(g,m+1),y=b>r|(S>r?2:0)|(v>r?4:0)|(M>r?8:0),x=Bh[y];if(y===5||y===10){let R=(b+S+v+M)/4;x=(y===5?R<=r:R>r)?[[0,1],[2,3]]:[[3,0],[1,2]]}if(x.length===0)continue;let T=R=>R===0?[g+l(b,S),m]:R===1?[g+1,m+l(S,v)]:R===2?[g+l(M,v),m+1]:[g,m+l(b,M)];for(let[R,C]of x)n.push([T(R),T(C)])}if(n.length===0)return[];let i=m=>`${Math.round(m[0]*1e4)}:${Math.round(m[1]*1e4)}`,s=new Map;n.forEach((m,g)=>{for(let b of m){let S=i(b),v=s.get(S);v?v.push(g):s.set(S,[g])}});let u=Array(n.length).fill(!1),f=(m,g)=>{for(let b of s.get(m)??[])if(b!==g&&!u[b])return b;return-1},c=[];for(let m=0;m<n.length;m+=1){if(u[m])continue;u[m]=!0;let g=[n[m][0],n[m][1]],b=m;for(;;){let S=g[g.length-1],v=f(i(S),b);if(v<0)break;u[v]=!0;let[M,y]=n[v];g.push(i(M)===i(S)?y:M),b=v}for(b=m;;){let S=g[0],v=f(i(S),b);if(v<0)break;u[v]=!0;let[M,y]=n[v];g.unshift(i(M)===i(S)?y:M),b=v}c.push(g)}return c}function _h(e,t,a){let r=0,n=0,o=0,l=0,i=0,s=0,u=(c,m)=>{let g=(m*t+c)*4,b=e[g+3];l+=b,s+=1,!(b<128)&&(r+=e[g],n+=e[g+1],o+=e[g+2],i+=1)};for(let c=0;c<t;c+=1)u(c,0),u(c,a-1);for(let c=1;c<a-1;c+=1)u(0,c),u(t-1,c);let f=Math.max(1,i);return{r:r/f,g:n/f,b:o/f,alpha:l/Math.max(1,s)}}function Wh(e,t,a,r){let n=_h(e,t,a),o=n.alpha<128,l=new Float32Array(t*a);for(let u=0;u<l.length;u+=1){let f=u*4,c=e[f+3]/255;if(o){l[u]=c;continue}let m=(e[f]-n.r)/255,g=(e[f+1]-n.g)/255,b=(e[f+2]-n.b)/255;l[u]=c*Math.sqrt((m*m+g*g+b*b)/3)}let i=1;if(!o){let u=new Int32Array(64);for(let g of l)u[Math.min(63,Math.max(0,Math.round(g*63)))]+=1;let f=l.length*.95,c=0,m=0;for(;m<u.length&&(c+=u[m],!(c>=f));m+=1);i=Math.max(.08,m/63)}let s=new Float32Array(l.length);for(let u=0;u<l.length;u+=1){let f=Math.min(1,l[u]/i);s[u]=r?1-f:f}return s}function Gh(e,t,a){let r=new Float32Array((t+2)*(a+2));for(let n=0;n<a;n+=1)r.set(e.subarray(n*t,(n+1)*t),(n+1)*(t+2)+1);return r}function up(e,t={}){let a=Math.max(32,Math.min(512,Math.round(t.sampleSize??192))),r="naturalWidth"in e?e.naturalWidth:"width"in e?Number(e.width):a,n="naturalHeight"in e?e.naturalHeight:"height"in e?Number(e.height):a;if(!(r>0)||!(n>0))throw Error("The comet logo image has no pixels.");let o=a/Math.max(r,n),l=Math.max(3,Math.round(r*o)),i=Math.max(3,Math.round(n*o)),s=document.createElement("canvas");s.width=l,s.height=i;let u=s.getContext("2d",{willReadFrequently:!0});if(!u)throw Error("Could not read the comet logo image.");u.clearRect(0,0,l,i),u.drawImage(e,0,0,l,i);let f=u.getImageData(0,0,l,i).data,c=Ih(Gh(Wh(f,l,i,t.invert===!0),l,i),l+2,i+2,t.threshold??.5);if(c.length===0)throw Error("The comet logo image has no visible shape at this threshold. Try inverting it.");let m=Ea(t),g=c.map(S=>({line:S,length:Ca(S)})).sort((S,v)=>v.length-S.length),b=g[0].length*Math.max(0,Math.min(1,t.minContourFraction??.08));return Or(g.filter(S=>S.length>=b).slice(0,Math.max(1,Math.floor(m/Pa))).map(S=>S.line),t)}var cp=3,G={version:3,fieldSpeed:1.62,fieldDepth:6.51,fieldSpread:2.18,centerClearRadius:200,centerClearAspect:1,centerClearSquareness:2,centerClearLeak:0,centerClearFalloff:1,centerClearOffsetX:0,centerClearOffsetY:0,fieldAlign:0,formationDirectness:0,formationMaxTravel:0,formationEase:0,formationWiggle:0,formationInterrupt:2,fieldTrailLength:1,fieldParticleSize:1,logoScale:.85,logoOffsetX:0,logoOffsetY:0,logoParticleSize:1,logoDensity:1,logoTrailLength:1,logoMotion:1,formationDuration:1.1,rejoinDuration:1.1,formationRejoinScale:1.18,formationRejoinMargin:.45,formationStagger:.1,centerPreference:.78,sparkFrequency:1,sparkSize:1,sparkBrightness:1,sparkTrailLength:1,burstProbability:.62,waveProbability:.28,surfaceEffects:1,fireScale:1,fireIntensity:1,fireSpeed:1,fireTurbulence:1,flameHeight:1,weatherSpeed:1,weatherVariation:1,coronaMist:1,curlingWisps:1,hotRim:1,eruptionFrequency:.08,eruptionScale:1,eruptionIntensity:1,eruptionParticles:1,eruptionCycleSpeed:1};function O(e,t,a,r){return typeof e=="number"&&Number.isFinite(e)?Math.max(a,Math.min(r,e)):t}function Oh(e){let t=e&&typeof e=="object"?e:{},a=t.version!==3&&t.formationDuration===1.8?G.formationDuration:t.formationDuration;return{version:3,fieldSpeed:O(t.fieldSpeed,G.fieldSpeed,0,4),fieldDepth:O(t.fieldDepth,G.fieldDepth,2,12),fieldSpread:O(t.fieldSpread,G.fieldSpread,.5,5),centerClearRadius:O(t.centerClearRadius,G.centerClearRadius,0,400),centerClearAspect:O(t.centerClearAspect,G.centerClearAspect,.25,4),centerClearSquareness:O(t.centerClearSquareness,G.centerClearSquareness,2,12),centerClearLeak:O(t.centerClearLeak,G.centerClearLeak,0,.5),centerClearFalloff:O(t.centerClearFalloff,G.centerClearFalloff,.05,8),centerClearOffsetX:O(t.centerClearOffsetX,G.centerClearOffsetX,-400,400),centerClearOffsetY:O(t.centerClearOffsetY,G.centerClearOffsetY,-400,400),fieldAlign:O(t.fieldAlign,G.fieldAlign,0,1),formationDirectness:O(t.formationDirectness,G.formationDirectness,0,1),formationMaxTravel:O(t.formationMaxTravel,G.formationMaxTravel,0,8),formationEase:O(t.formationEase,G.formationEase,0,4),formationWiggle:O(t.formationWiggle,G.formationWiggle,0,3),formationInterrupt:O(t.formationInterrupt,G.formationInterrupt,0,2),fieldTrailLength:O(t.fieldTrailLength,G.fieldTrailLength,0,3),fieldParticleSize:O(t.fieldParticleSize,G.fieldParticleSize,.25,3),logoScale:O(t.logoScale,G.logoScale,.35,1.5),logoOffsetX:O(t.logoOffsetX,G.logoOffsetX,-400,400),logoOffsetY:O(t.logoOffsetY,G.logoOffsetY,-400,400),logoParticleSize:O(t.logoParticleSize,G.logoParticleSize,.25,3),logoDensity:O(t.logoDensity,G.logoDensity,1,5),logoTrailLength:O(t.logoTrailLength,G.logoTrailLength,0,3),logoMotion:O(t.logoMotion,G.logoMotion,0,3),formationDuration:O(a,G.formationDuration,.2,6),rejoinDuration:O(t.rejoinDuration,G.rejoinDuration,.2,6),formationRejoinScale:O(t.formationRejoinScale,G.formationRejoinScale,.2,2),formationRejoinMargin:O(t.formationRejoinMargin,G.formationRejoinMargin,0,2),formationStagger:O(t.formationStagger,G.formationStagger,0,.9),centerPreference:O(t.centerPreference,G.centerPreference,0,1),sparkFrequency:O(t.sparkFrequency,G.sparkFrequency,.1,4),sparkSize:O(t.sparkSize,G.sparkSize,.2,3),sparkBrightness:O(t.sparkBrightness,G.sparkBrightness,0,3),sparkTrailLength:O(t.sparkTrailLength,G.sparkTrailLength,0,3),burstProbability:O(t.burstProbability,G.burstProbability,0,1),waveProbability:O(t.waveProbability,G.waveProbability,0,1),surfaceEffects:O(t.surfaceEffects,G.surfaceEffects,0,3),fireScale:O(t.fireScale,G.fireScale,.25,3),fireIntensity:O(t.fireIntensity,G.fireIntensity,0,3),fireSpeed:O(t.fireSpeed,G.fireSpeed,0,3),fireTurbulence:O(t.fireTurbulence,G.fireTurbulence,0,3),flameHeight:O(t.flameHeight,G.flameHeight,.2,3),weatherSpeed:O(t.weatherSpeed,G.weatherSpeed,0,3),weatherVariation:O(t.weatherVariation,G.weatherVariation,0,2),coronaMist:O(t.coronaMist,G.coronaMist,0,3),curlingWisps:O(t.curlingWisps,G.curlingWisps,0,3),hotRim:O(t.hotRim,G.hotRim,0,3),eruptionFrequency:O(t.eruptionFrequency,G.eruptionFrequency,0,1),eruptionScale:O(t.eruptionScale,G.eruptionScale,.2,3),eruptionIntensity:O(t.eruptionIntensity,G.eruptionIntensity,0,3),eruptionParticles:O(t.eruptionParticles,G.eruptionParticles,0,3),eruptionCycleSpeed:O(t.eruptionCycleSpeed,G.eruptionCycleSpeed,.1,4)}}function _o(e){return e.map(([t,a])=>`vec2(${t.toFixed(5)}, ${a.toFixed(5)})`).join(`,
  `)}function zh(e){let t=_i(e),a=t.logo,r=_o(e.points),n=e.sparkAnchorIndices.length,o=_o(e.sparkAnchorIndices.map(l=>e.points[l]));return`#version 300 es
precision highp float;

uniform vec2 uResolution;
uniform float uFieldTime;
uniform float uFormation;
uniform float uRejoining;
uniform float uRejoinProgress;
uniform float uRejoinElapsed;
uniform float uRejoinStartFieldTime;
uniform float uRejoinStartFormation;
uniform float uRejoinDuration;
uniform vec2 uFormationOrigin;
uniform float uFormationStartFieldTime;
uniform float uFieldSpeed;
uniform float uFieldDepth;
uniform float uFieldSpread;
uniform float uCenterClearRadius;
uniform float uCenterClearAspect;
uniform float uCenterClearSquareness;
uniform float uCenterClearLeak;
uniform float uCenterClearFalloff;
uniform float uCenterClearOffsetX;
uniform float uCenterClearOffsetY;
uniform float uFieldAlign;
uniform float uFormationDirectness;
uniform float uFormationMaxTravel;
uniform float uFormationEase;
uniform float uFormationWiggle;
uniform float uFieldTrailLength;
uniform float uFieldParticleSize;
uniform float uLogoScale;
uniform float uLogoOffsetX;
uniform float uLogoOffsetY;
uniform float uLogoParticleSize;
uniform float uLogoTrailLength;
uniform float uLogoMotion;
uniform float uFormationDuration;
uniform float uFormationStagger;
uniform float uCenterPreference;
uniform float uSparkFrequency;
uniform float uSparkSize;
uniform float uSparkTrailLength;
uniform float uBurstProbability;
uniform float uWaveProbability;
uniform float uFireScale;
uniform float uFireSpeed;
uniform float uWeatherSpeed;
uniform float uWeatherVariation;
uniform float uEruptionFrequency;
uniform float uEruptionScale;
uniform float uEruptionCycleSpeed;

out vec2 vLocalPx;
flat out float vLengthPx;
flat out float vRadiusPx;
flat out float vOpacity;
flat out float vTrailProgressStart;
flat out float vIsHead;
flat out float vIsSpark;
flat out float vSparkKind;
flat out float vSparkFlicker;
flat out float vIsSurfaceEffect;
flat out float vEffectProgress;
flat out vec2 vEffectOutward;
flat out float vEffectRadiusPx;
flat out float vEffectSeed;

const float SEED = 57383.0;
const float FIELD_TRAIL_SAMPLE_TIME = 0.14;
const float LOGO_TRAIL_SAMPLE_TIME = 0.42;
const float NEEDLE_TRAIL_SAMPLE_TIME = 0.16;
const float BURST_TRAIL_SAMPLE_TIME = 0.11;
const float WAVE_TRAIL_SAMPLE_TIME = 0.055;
const float LOGO_RADIUS_MIN_PX = 2.0;
const float LOGO_RADIUS_SCALE = 0.006;
const float SPARK_KIND_NEEDLE = 0.0;
const float SPARK_KIND_BURST = 1.0;
const float SPARK_KIND_WAVE = 2.0;
const float EVENT_SPARK_START = ${48 .toFixed(1)};
const float EVENT_GROUP_SIZE = ${(48/8).toFixed(1)};
const float FORMATION_STARTER_SHARE = 0.12;
const float FIELD_SPAWN_TIME = 0.62;
const float FIELD_RETIRE_TIME = 0.34;
const float FIELD_SPAWN_RADIUS_SCALE = 0.24;
const int REJOIN_CANDIDATE_COUNT = 3;
const float REJOIN_CANDIDATES[REJOIN_CANDIDATE_COUNT] = float[REJOIN_CANDIDATE_COUNT](
  0.85, 1.0, 1.18
);
const float MAX_TRAIL_WORLD = 0.22;
const float LOGO_MAX_TRAIL_WORLD = 0.2;
const float TAU = 6.28318530718;
const int TRAIL_SEGMENT_COUNT = 8;
const vec2 LOGO_POINTS[${a}] = vec2[${a}](
  ${r}
);
const vec2 SPARK_ANCHOR_POINTS[${n}] = vec2[${n}](
  ${o}
);
const vec2 QUAD[6] = vec2[6](
  vec2(0.0, -1.0),
  vec2(1.0, -1.0),
  vec2(1.0, 1.0),
  vec2(0.0, -1.0),
  vec2(1.0, 1.0),
  vec2(0.0, 1.0)
);

float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

float temporalNoise(float seed, float time) {
  float cell = floor(time);
  float local = fract(time);
  float blend = local * local * (3.0 - 2.0 * local);
  return mix(
    hash11(seed + cell * 17.17),
    hash11(seed + (cell + 1.0) * 17.17),
    blend
  );
}

// Cubic ease with explicit endpoint slopes. The old t(2-t) was this with
// startSlope 2, which spent a comet's whole speed budget in the first ~15% of
// the trip: a yank, then a flat plateau, then decay. A gentler startSlope moves
// the speed peak to the middle and gives a natural bell instead. The departure
// tangent is scaled by 1/startSlope, so the departure speed still equals the
// field velocity exactly no matter which slope is chosen.
float travelEase(float t, float startSlope, float endSlope) {
  float progress = clamp(t, 0.0, 1.0);
  float squared = progress * progress;
  float cubed = squared * progress;
  return (3.0 * squared - 2.0 * cubed)
    + startSlope * (cubed - 2.0 * squared + progress)
    + endSlope * (cubed - squared);
}

float formationTravelEase(float t, float id) {
  int easeMode = int(uFormationEase + 0.5);
  if (easeMode == 1) return travelEase(t, 0.0, 0.0);
  if (easeMode == 2) return travelEase(t, 1.6, 0.0);
  if (easeMode == 3) return clamp(t, 0.0, 1.0);
  if (easeMode == 4) return travelEase(t, 0.0, 1.4);
  return travelEase(t, 0.35, 0.0);
}

float historicalFormation(float time, float maximumFormation) {
  float elapsed = time - uFormationStartFieldTime;
  return min(
    maximumFormation,
    clamp(elapsed / max(uFormationDuration, 0.001), 0.0, 1.0)
  );
}

vec2 formationSettleWiggle(float id, float local, vec2 direction, float span) {
  if (uFormationWiggle <= 0.0) return vec2(0.0);
  vec2 normal = vec2(-direction.y, direction.x);
  float frequency = mix(2.1, 3.6, hash11(id * 53.71));
  float phase = hash11(id * 17.93) * TAU;
  float ring = sin(local * frequency * TAU + phase) * exp(-4.2 * local);
  float onset = smoothstep(0.0, 0.22, local);
  return normal * ring * onset * span * 0.05 * uFormationWiggle;
}

// Lateral swing added to a steered path. The 16e²(1-e)² shape is zero in both
// value and slope at e=0 and e=1, so it bends the trajectory without disturbing
// the velocity match at either end. Sign varies per comet so they swing both ways.
vec2 trajectoryBow(float id, vec2 direction, float span, float ease) {
  vec2 normal = vec2(-direction.y, direction.x);
  float swing = hash11(id * 61.7) < 0.5 ? -1.0 : 1.0;
  float amount = swing * mix(0.18, 0.38, hash11(id * 71.3)) * span
    * (1.0 - clamp(uFormationDirectness, 0.0, 1.0));
  float inverse = 1.0 - ease;
  // Triple root at both ends: zero value, slope AND curvature there. The
  // earlier 16e²(1-e)² was only a double root, so it handed the path a lateral
  // acceleration kick right where it rejoins the field — read as a kink even
  // though position and velocity matched exactly.
  return normal * amount * 64.0 * ease * ease * ease * inverse * inverse * inverse;
}

vec2 cubicHermite(vec2 start, vec2 startTangent, vec2 end, vec2 endTangent, float t) {
  float t2 = t * t;
  float t3 = t2 * t;
  return (2.0 * t3 - 3.0 * t2 + 1.0) * start
    + (t3 - 2.0 * t2 + t) * startTangent
    + (-2.0 * t3 + 3.0 * t2) * end
    + (t3 - t2) * endTangent;
}

vec2 fieldDirection(float id) {
  vec2 direction = vec2(hash11(id * 2.71), hash11(id * 4.93)) * 2.0 - 1.0;
  int alignIndex = int(floor(id - SEED * 17.173 + 0.5));
  if (uFieldAlign > 0.0 && alignIndex >= 0 && alignIndex < ${a}) {
    vec2 anchor = LOGO_POINTS[alignIndex];
    float anchorLength = length(anchor);
    float directionLength = length(direction);
    if (anchorLength > 0.0001 && directionLength > 0.0001) {
      vec2 mixed = mix(direction / directionLength, anchor / anchorLength, uFieldAlign);
      float mixedLength = length(mixed);
      direction = (mixedLength > 0.0001 ? mixed / mixedLength : anchor / anchorLength)
        * directionLength;
    }
  }
  direction *= mix(0.58, 1.35, hash11(id * 8.11)) * uFieldSpread;
  float magnitude = length(direction);
  return direction / max(magnitude, 0.00001) * max(magnitude, 0.46 * uFieldSpread);
}

vec2 centerClearOffsetWorld() {
  return vec2(uCenterClearOffsetX, -uCenterClearOffsetY) / max(0.5 * uResolution.y, 1.0);
}

// Moves the formed logo only. Every anchor stays logo-local, so directions
// derived from an anchor keep pointing away from the logo, not the canvas.
vec2 logoOffsetWorld() {
  return vec2(uLogoOffsetX, -uLogoOffsetY) / max(0.5 * uResolution.y, 1.0);
}

float centerClearWorld(vec2 outward, float id) {
  float base = uCenterClearRadius / max(0.5 * uResolution.y, 1.0);
  float a = base * max(uCenterClearAspect, 0.0001);
  float b = base;
  float c = outward.x;
  float s = outward.y;
  float n = max(uCenterClearSquareness, 2.0);
  float k = pow(pow(abs(c) / a, n) + pow(abs(s) / b, n), 1.0 / n);
  float radius = 1.0 / max(k, 0.00001);
  float leakSeed = hash11(id * 2.71);
  float leaks = uCenterClearLeak > 0.0
    ? step(hash11(leakSeed * 613.1 + 7.3), uCenterClearLeak)
    : 0.0;
  float inward = mix(
    0.3,
    1.0,
    pow(hash11(leakSeed * 771.7 + 19.1), 1.0 / max(uCenterClearFalloff, 0.001))
  );
  return radius * mix(1.0, inward, leaks);
}

void fieldCycleBounds(float id, float time, out float age, out float remaining) {
  float speed = max(uFieldSpeed, 0.0001);
  float phase = hash11(id * 1.37) * uFieldDepth;
  float cycle = floor((phase - time * speed) / uFieldDepth);
  age = time - (phase - (cycle + 1.0) * uFieldDepth) / speed;
  remaining = (phase - cycle * uFieldDepth) / speed - time;
}

float fieldSpawnGrowth(float id, float time) {
  float age;
  float remaining;
  fieldCycleBounds(id, time, age, remaining);
  return smoothstep(0.0, FIELD_SPAWN_TIME, age);
}

float fieldLife(float id, float time) {
  float age;
  float remaining;
  fieldCycleBounds(id, time, age, remaining);
  return smoothstep(0.0, FIELD_SPAWN_TIME, age)
    * smoothstep(0.0, FIELD_RETIRE_TIME, remaining);
}

void fieldPoint(
  float id,
  float time,
  out vec2 head,
  out float radiusPx,
  out vec2 velocity
) {
  float z = mod(hash11(id * 1.37) * uFieldDepth - time * uFieldSpeed, uFieldDepth) + 0.24;
  vec2 direction = fieldDirection(id);
  float magnitude = length(direction);
  vec2 outward = direction / max(magnitude, 0.00001);
  float travelled = magnitude / z - magnitude / (uFieldDepth + 0.24);
  head = centerClearOffsetWorld() + outward * (centerClearWorld(outward, id) + travelled);
  velocity = direction * uFieldSpeed / (z * z);
  float perspective = mix(0.28, 1.42, 1.0 - z / (uFieldDepth + 0.24));
  radiusPx = max(1.25, uResolution.y * 0.004 * perspective)
    * uFieldParticleSize
    * mix(FIELD_SPAWN_RADIUS_SCALE, 1.0, fieldSpawnGrowth(id, time));
}

float fieldCycleIndex(float id, float time) {
  return floor((hash11(id * 1.37) * uFieldDepth - time * uFieldSpeed) / uFieldDepth);
}

float formationOrder(float id) {
  vec2 startHead;
  float startRadiusPx;
  vec2 startVelocity;
  fieldPoint(id, uFormationStartFieldTime, startHead, startRadiusPx, startVelocity);
  vec2 originWorld = (2.0 * uFormationOrigin - uResolution) / uResolution.y;
  float centerOrder = smoothstep(0.04, 1.62, length(startHead));
  float pointerOrder = smoothstep(0.04, 2.1, distance(startHead, originWorld));
  float preferredOrder = mix(pointerOrder, centerOrder, uCenterPreference);
  float starterAdjustedOrder = max(
    0.0,
    (preferredOrder - FORMATION_STARTER_SHARE) / (1.0 - FORMATION_STARTER_SHARE)
  );
  float evenOrder = mix(starterAdjustedOrder, hash11(id * 7.71), 0.4);
  evenOrder = pow(clamp(evenOrder, 0.0, 1.0), 1.7);
  return clamp(
    evenOrder + mix(-0.05, 0.05, hash11(id * 19.31)),
    0.0,
    1.0
  );
}

float localFormation(float id, float formation) {
  float delay = formationOrder(id) * uFormationStagger;
  return clamp((formation - delay) / (1.0 - uFormationStagger), 0.0, 1.0);
}

float formationDepartTime(float id) {
  return uFormationStartFieldTime
    + formationOrder(id) * uFormationStagger * uFormationDuration;
}

float formationTravelTime() {
  return max(uFormationDuration * (1.0 - uFormationStagger), 0.001);
}

vec2 logoContourTangent(int index) {
  int previousIndex = max(0, index - 1);
  int nextIndex = min(${a-1}, index + 1);
  vec2 contour = LOGO_POINTS[nextIndex] - LOGO_POINTS[previousIndex];
  return contour / max(length(contour), 0.00001);
}

float sparkGroupSeed(float sparkId) {
  if (sparkId < EVENT_SPARK_START) return sparkId + 1.0;
  return floor((sparkId - EVENT_SPARK_START) / EVENT_GROUP_SIZE) + 61.0;
}

float sparkCycleDuration(float sparkId, float groupSeed) {
  if (sparkId < EVENT_SPARK_START) {
    return mix(1.0, 1.8, hash11(groupSeed * 3.17)) / uSparkFrequency;
  }
  return mix(1.3, 2.2, hash11(groupSeed * 3.17)) / uSparkFrequency;
}

float sparkCycleValue(float sparkId, float time) {
  float groupSeed = sparkGroupSeed(sparkId);
  float duration = sparkCycleDuration(sparkId, groupSeed);
  return time / duration + hash11(groupSeed * 5.83);
}

float sparkCyclePhase(float sparkId, float time) {
  return fract(sparkCycleValue(sparkId, time));
}

float sparkCycleRandom(float sparkId, float time, float salt) {
  float groupSeed = sparkGroupSeed(sparkId);
  float cycleIndex = floor(sparkCycleValue(sparkId, time));
  return hash11(groupSeed * 1.91 + cycleIndex * 7.13 + salt);
}

float sparkKind(float sparkId, float time) {
  if (sparkId < EVENT_SPARK_START) return SPARK_KIND_NEEDLE;
  float choice = sparkCycleRandom(sparkId, time, 11.7);
  float eventProbability = min(1.0, uBurstProbability + uWaveProbability);
  float needleProbability = 1.0 - eventProbability;
  float normalizedBurstProbability = eventProbability
    * uBurstProbability
    / max(uBurstProbability + uWaveProbability, 0.0001);
  if (choice < needleProbability) return SPARK_KIND_NEEDLE;
  if (choice < needleProbability + normalizedBurstProbability) return SPARK_KIND_BURST;
  return SPARK_KIND_WAVE;
}

float sparkActiveShare(float kind) {
  if (kind < 0.5) return 0.4;
  if (kind < 1.5) return 0.36;
  return 0.44;
}

float sparkEventVisibility(float sparkId, float time) {
  float threshold = sparkId < EVENT_SPARK_START ? 0.22 : 0.02;
  return step(threshold, sparkCycleRandom(sparkId, time, 23.4));
}

float sparkSizeScale(float sparkId, float time) {
  float randomSize = sparkCycleRandom(sparkId, time, 37.2);
  return mix(0.68, 1.42, pow(randomSize, 1.25)) * uSparkSize;
}

int sparkAnchorIndex(float sparkId, float time) {
  float groupSeed = sparkGroupSeed(sparkId);
  float cycleIndex = floor(sparkCycleValue(sparkId, time));
  float anchor = mod(groupSeed * 29.0 + cycleIndex * 17.0, float(${n}));
  return int(floor(anchor));
}

vec2 sparkHead(float sparkId, float time, out float radiusPx) {
  float kind = sparkKind(sparkId, time);
  float groupSeed = sparkGroupSeed(sparkId);
  float sizeScale = sparkSizeScale(sparkId, time);
  int anchorIndex = sparkAnchorIndex(sparkId, time);
  vec2 origin = SPARK_ANCHOR_POINTS[anchorIndex] * uLogoScale;
  vec2 outward = origin / max(length(origin), 0.00001);
  vec2 tangent = vec2(-outward.y, outward.x);
  origin += logoOffsetWorld();
  float progress = clamp(sparkCyclePhase(sparkId, time) / sparkActiveShare(kind), 0.0, 1.0);
  float travelEase = 1.0 - (1.0 - progress) * (1.0 - progress);

  if (kind < 0.5) {
    float spread = mix(-0.34, 0.34, hash11(sparkId * 7.19 + 1.0));
    vec2 direction = normalize(outward + tangent * spread);
    float travelRandom = mix(
      hash11(sparkId * 11.57 + 2.0),
      sparkCycleRandom(sparkId, time, 41.9),
      0.58
    );
    float travel = mix(0.09, 0.32, travelRandom) * travelEase * mix(0.82, 1.12, sizeScale);
    float arc = sin(progress * 3.14159265) * mix(-0.018, 0.018, hash11(sparkId * 13.23 + 3.0));
    float gravity = mix(0.008, 0.032, hash11(sparkId * 17.41 + 4.0)) * progress * progress;
    radiusPx = max(0.82, uResolution.y * 0.0019 * mix(0.72, 1.12, hash11(sparkId * 19.13 + 5.0)))
      * sizeScale;
    return origin + direction * travel + tangent * arc + vec2(0.0, -gravity);
  }

  if (kind < 1.5) {
    float member = mod(sparkId - EVENT_SPARK_START, EVENT_GROUP_SIZE);
    float memberProgress = member / (EVENT_GROUP_SIZE - 1.0);
    float spread = mix(-0.78, 0.78, memberProgress)
      + mix(-0.08, 0.08, hash11(sparkId * 7.31 + 6.0));
    vec2 direction = normalize(outward + tangent * spread);
    float travel = mix(0.08, 0.27, sparkCycleRandom(sparkId, time, 43.6))
      * travelEase
      * mix(0.86, 1.14, sizeScale);
    float gravity = mix(0.012, 0.04, hash11(sparkId * 13.91 + 7.0)) * progress * progress;
    origin += tangent * mix(-0.007, 0.007, hash11(sparkId * 17.17 + 8.0));
    radiusPx = max(0.88, uResolution.y * 0.002 * mix(0.76, 1.12, hash11(sparkId * 19.61 + 9.0)))
      * sizeScale;
    return origin + direction * travel + vec2(0.0, -gravity);
  }

  float member = mod(sparkId - EVENT_SPARK_START, EVENT_GROUP_SIZE);
  float centeredMember = member / (EVENT_GROUP_SIZE - 1.0) * 2.0 - 1.0;
  origin += tangent * centeredMember * 0.055 * mix(0.82, 1.18, sizeScale);
  vec2 direction = normalize(outward + tangent * centeredMember * 0.18);
  float travel = 0.03
    + mix(0.15, 0.24, sparkCycleRandom(sparkId, time, 47.3))
      * travelEase
      * mix(0.86, 1.12, sizeScale);
  float bow = (1.0 - centeredMember * centeredMember)
    * sin(progress * 3.14159265)
    * 0.018;
  radiusPx = max(0.82, uResolution.y * 0.00185 * mix(0.84, 1.08, hash11(groupSeed * 13.37)))
    * sizeScale;
  return origin + direction * travel + outward * bow;
}

float sparkOpacity(float sparkId, float time) {
  float kind = sparkKind(sparkId, time);
  float progress = sparkCyclePhase(sparkId, time) / sparkActiveShare(kind);
  float fadeInEnd = kind < 0.5 ? 0.08 : kind < 1.5 ? 0.14 : 0.12;
  float fadeOutStart = kind < 0.5 ? 0.62 : kind < 1.5 ? 0.48 : 0.55;
  float life = smoothstep(0.0, fadeInEnd, progress)
    * (1.0 - smoothstep(fadeOutStart, 1.0, progress))
    * sparkEventVisibility(sparkId, time);
  float formationVisibility = smoothstep(0.62, 0.92, uFormation);
  if (uRejoining > 0.5) {
    formationVisibility *= 1.0 - smoothstep(0.0, 0.28, uRejoinProgress);
  }
  return life * formationVisibility;
}

vec2 livingLogoOffset(int index, float id, float time) {
  vec2 tangent = logoContourTangent(index);
  vec2 normal = vec2(-tangent.y, tangent.x);
  float phase = time * mix(3.8, 6.0, hash11(id * 41.7))
    + float(index) * 0.38
    + hash11(id * 47.3) * TAU;
  float crawl = sin(phase) + 0.42 * sin(phase * 1.91 + id);
  float squirm = sin(phase * 0.73 + id * 0.17) + 0.36 * cos(phase * 1.37);
  return (tangent * crawl * 0.015 + normal * squirm * 0.0095) * uLogoMotion;
}

// Pool comets outnumber the logo points, so each one lands somewhere between
// its own slot and the next along the contour instead of stacking on it.
float gLogoBlend = 0.0;

vec2 logoAnchor(int index) {
  vec2 anchor = LOGO_POINTS[index];
  if (gLogoBlend <= 0.0) return anchor;
  return mix(anchor, LOGO_POINTS[(index + 1) % ${a}], gLogoBlend);
}

vec2 steeredHead(int index, float id, float time, float formation, out float radiusPx) {
  vec2 freeHead;
  vec2 freeVelocity;
  fieldPoint(id, time, freeHead, radiusPx, freeVelocity);
  float local = localFormation(id, formation);
  if (local <= 0.0) return freeHead;

  vec2 departHead;
  vec2 departVelocity;
  float departRadiusPx;
  fieldPoint(id, formationDepartTime(id), departHead, departRadiusPx, departVelocity);
  radiusPx = departRadiusPx;

  vec2 target = logoAnchor(index) * uLogoScale + logoOffsetWorld();
  // Cap the flight: a comet whose slot is further than uFormationMaxTravel is
  // re-seated on its own entry ray, just inside the nearest viewport edge, so
  // it enters from close by instead of crossing the whole canvas.
  if (uFormationMaxTravel > 0.0
    && length(target - departHead) > uFormationMaxTravel) {
    vec2 entryDir = normalize(departHead - target);
    float halfWidth = uResolution.x / max(uResolution.y, 1.0);
    float edge = min(
      halfWidth / max(abs(entryDir.x), 0.0001),
      1.0 / max(abs(entryDir.y), 0.0001)
    );
    departHead = target + entryDir * (uFormationMaxTravel * min(edge, 1.0));
    departVelocity = -entryDir * max(length(departVelocity), 0.25);
  }
  vec2 toTarget = target - departHead;
  float span = max(length(toTarget), 0.00001);
  float travel = formationTravelTime();

  float departSpeed = length(departVelocity);
  vec2 launchDirection = departVelocity / max(departSpeed, 0.00001);
  vec2 startTangent = launchDirection
    * min(departSpeed * travel, span * mix(0.62, 0.03, clamp(uFormationDirectness, 0.0, 1.0)));

  vec2 approach = toTarget / span;
  vec2 approachNormal = vec2(-approach.y, approach.x);
  vec2 endTangent = normalize(
    approach
      + approachNormal * mix(-0.62, 0.62, hash11(id * 27.53))
        * (1.0 - clamp(uFormationDirectness, 0.0, 1.0))
  ) * span * 0.58;

  float livingBlend = smoothstep(0.08, 0.72, local);
  float ease = formationTravelEase(local, id);
  vec2 curved = cubicHermite(departHead, startTangent, target, endTangent, ease)
    + trajectoryBow(id, approach, span, ease)
    + formationSettleWiggle(id, local, approach, span);
  return curved + livingLogoOffset(index, id, time) * livingBlend;
}

// Each comet picks the return trip whose travel speed most closely matches the
// field speed it will have on arrival, so it never has to brake to a halt.
float rejoinDurationFor(float id, vec2 start) {
  float bestDuration = uRejoinDuration;
  float bestCost = 1000000.0;
  for (int candidate = 0; candidate < REJOIN_CANDIDATE_COUNT; candidate++) {
    float duration = max(REJOIN_CANDIDATES[candidate] * uRejoinDuration, 0.05);
    vec2 head;
    float headRadiusPx;
    vec2 velocity;
    fieldPoint(id, uRejoinStartFieldTime + duration, head, headRadiusPx, velocity);
    float travelSpeed = distance(head, start) / duration;
    float arrivalSpeed = length(velocity);
    float cost = abs(log(max(travelSpeed, 0.000001) / max(arrivalSpeed, 0.000001)));
    if (cost < bestCost) {
      bestCost = cost;
      bestDuration = duration;
    }
  }
  return bestDuration;
}

float rejoinStagger(float id, float progress) {
  float delay = hash11(id * 91.37) * 0.14;
  return clamp((progress - delay) / max(1.0 - delay, 0.001), 0.0, 1.0);
}

// Drag curve: initial velocity 3.2-9.5x the average and hashed per comet, which
// is what reads as an explosion rather than a tween.
float rejoinPopEase(float t, float id) {
  float progress = clamp(t, 0.0, 1.0);
  float decay = mix(3.2, 9.5, hash11(id * 27.91));
  return (1.0 - exp(-decay * progress)) / (1.0 - exp(-decay));
}

// Opacity spans local 0 -> 0.5 while movement spans 0 -> 1, so the throw keeps
// travelling after the comet is invisible.
float rejoinCrossFade(int index, float id, float progress) {
  return 1.0 - smoothstep(0.0, 0.5, rejoinStagger(id, progress));
}

vec2 rejoinHead(int index, float id, float elapsed, out float radiusPx, out bool freeField) {
  float startFieldRadiusPx;
  vec2 start = steeredHead(
    index,
    id,
    uRejoinStartFieldTime,
    uRejoinStartFormation,
    startFieldRadiusPx
  );
  float rejoinDuration = rejoinDurationFor(id, start);
  if (elapsed >= rejoinDuration) {
    vec2 head;
    vec2 velocity;
    fieldPoint(id, uRejoinStartFieldTime + elapsed, head, radiusPx, velocity);
    freeField = true;
    return head;
  }
  freeField = false;
  float progress = clamp(elapsed / rejoinDuration, 0.0, 1.0);
  float logoRadiusPx = max(LOGO_RADIUS_MIN_PX, uResolution.y * LOGO_RADIUS_SCALE) * uLogoParticleSize;
  float startRadiusPx = mix(
    startFieldRadiusPx,
    logoRadiusPx,
    formationTravelEase(localFormation(id, uRejoinStartFormation), id)
  );

  vec2 target;
  float targetRadiusPx;
  vec2 targetVelocity;
  fieldPoint(id, uRejoinStartFieldTime + rejoinDuration, target, targetRadiusPx, targetVelocity);

  radiusPx = mix(startRadiusPx, targetRadiusPx, progress);
  vec2 fromLogo = start - logoOffsetWorld();
  vec2 outward = fromLogo / max(length(fromLogo), 0.00001);
  vec2 scatter = vec2(
    hash11(id * 12.91) * 2.0 - 1.0,
    hash11(id * 27.13) * 2.0 - 1.0
  );
  vec2 throwDir = normalize(outward + scatter * 0.9);
  float throwSpan = mix(1.0, 2.4, hash11(id * 41.37));
  return start
    + throwDir
      * (rejoinPopEase(rejoinStagger(id, uRejoinProgress), id) * throwSpan);
}

vec2 sampleRejoinPath(int index, float id, float age, out float radiusPx, out bool freeField) {
  float sampleElapsed = uRejoinElapsed - age;
  if (sampleElapsed >= 0.0) {
    return rejoinHead(index, id, sampleElapsed, radiusPx, freeField);
  }

  float formation = historicalFormation(
    uRejoinStartFieldTime + sampleElapsed,
    uRejoinStartFormation
  );
  freeField = localFormation(id, formation) <= 0.0;
  return steeredHead(
    index,
    id,
    uRejoinStartFieldTime + sampleElapsed,
    formation,
    radiusPx
  );
}

// freeField reports whether this sample sits on the live starfield path, so the
// trail-cut guard can tell a real depth recycle from steered or frozen motion.
vec2 sampleParticlePath(
  int index,
  float id,
  float sparkId,
  bool logoParticle,
  bool sparkParticle,
  float age,
  out float radiusPx,
  out bool freeField
) {
  freeField = false;
  if (sparkParticle) return sparkHead(sparkId, uFieldTime - age, radiusPx);
  if (!logoParticle) {
    vec2 head;
    vec2 velocity;
    fieldPoint(id, uFieldTime - age, head, radiusPx, velocity);
    freeField = true;
    return head;
  }
  if (uRejoining > 0.5) return sampleRejoinPath(index, id, age, radiusPx, freeField);
  float formation = historicalFormation(uFieldTime - age, uFormation);
  freeField = localFormation(id, formation) <= 0.0;
  return steeredHead(index, id, uFieldTime - age, formation, radiusPx);
}

void main() {
  int index = gl_InstanceID;
  // Only the dedicated pool past the idle instances forms the logo; the idle
  // field keeps flying underneath it untouched.
  int extraLogoIndex = index - ${t.activeRender};
  bool extraLogo = extraLogoIndex >= 0;
  if (extraLogo) {
    index = extraLogoIndex % ${a};
    gLogoBlend = hash11(float(gl_InstanceID) * 3.71 + 5.3);
  }
  bool logoParticle = extraLogo;
  bool sparkParticle = !extraLogo && index >= ${t.render};
  float id = float(gl_InstanceID) + SEED * 17.173;
  float sourceParticleOpacity = logoParticle
    || sparkParticle
    || index < ${a}
    ? 1.0
    : 0.72;
  float sparkId = float(max(index - ${t.render}, 0));
  float currentSparkKind = sparkKind(sparkId, uFieldTime);
  float currentLocalFormation = logoParticle
    ? localFormation(id, uFormation)
    : 0.0;
  // Keyed off the GLOBAL formation, never per-comet local progress: on a
  // re-hover the formation resumes mid-way and every comet's local value is
  // already near 1, which would kill the trail.
  float logoTrailBlend = 0.0;
  if (logoParticle) {
    logoTrailBlend = uRejoining > 0.5
      ? 1.0
      : 1.0 - smoothstep(0.92, 1.0, uFormation);
  }
  float trailTime = mix(
    FIELD_TRAIL_SAMPLE_TIME * uFieldTrailLength,
    LOGO_TRAIL_SAMPLE_TIME * uLogoTrailLength,
    logoTrailBlend
  );
  // A pool comet's pre-departure history is a virtual field path it never flew,
  // so the trail window can never reach back past its own departure.
  if (logoParticle) {
    trailTime = min(
      trailTime,
      uRejoining > 0.5
        ? max(uRejoinElapsed, 0.0)
        : max(uFieldTime - formationDepartTime(id), 0.0)
    );
  }
  if (sparkParticle) {
    trailTime = (currentSparkKind < 0.5
      ? NEEDLE_TRAIL_SAMPLE_TIME
      : currentSparkKind < 1.5
        ? BURST_TRAIL_SAMPLE_TIME
        : WAVE_TRAIL_SAMPLE_TIME) * uSparkTrailLength;
  } else {
    // Cap the trail by how fast this comet is actually travelling along its own
    // path — the field velocity alone misses steered formation/release motion,
    // which is where the runaway streaks came from.
    float probeRadiusNow;
    float probeRadiusThen;
    bool probeFreeNow;
    bool probeFreeThen;
    vec2 probeNow = sampleParticlePath(
      index, id, sparkId, logoParticle, sparkParticle, 0.0, probeRadiusNow, probeFreeNow
    );
    vec2 probeThen = sampleParticlePath(
      index, id, sparkId, logoParticle, sparkParticle, trailTime, probeRadiusThen, probeFreeThen
    );
    bool probeRecycled = probeFreeNow
      && probeFreeThen
      && fieldCycleIndex(id, uFieldTime) != fieldCycleIndex(id, uFieldTime - trailTime);
    // One linear correction badly undershoots because a drag path covers most
    // of its distance early, so the cap converges instead.
    float maxTrailWorld = logoParticle
      ? LOGO_MAX_TRAIL_WORLD
      : MAX_TRAIL_WORLD * uFieldTrailLength;
    if (!probeRecycled) {
      for (int pass = 0; pass < 5; pass++) {
        float drawnTrailWorld = distance(probeNow, probeThen);
        if (drawnTrailWorld <= maxTrailWorld) break;
        trailTime *= 0.85 * maxTrailWorld / drawnTrailWorld;
        probeThen = sampleParticlePath(
          index, id, sparkId, logoParticle, sparkParticle, trailTime, probeRadiusThen, probeFreeThen
        );
      }
    }
  }

  int segmentIndex = gl_VertexID / 6;
  int cornerIndex = gl_VertexID - segmentIndex * 6;
  float segmentStart = float(segmentIndex) / float(TRAIL_SEGMENT_COUNT);
  float segmentEnd = float(segmentIndex + 1) / float(TRAIL_SEGMENT_COUNT);
  float olderAge = trailTime * (1.0 - segmentStart);
  float newerAge = trailTime * (1.0 - segmentEnd);
  float olderRadiusPx;
  float newerRadiusPx;
  bool tailOnFreeField;
  bool headOnFreeField;
  vec2 tail = sampleParticlePath(
    index,
    id,
    sparkId,
    logoParticle,
    sparkParticle,
    olderAge,
    olderRadiusPx,
    tailOnFreeField
  );
  vec2 head = sampleParticlePath(
    index,
    id,
    sparkId,
    logoParticle,
    sparkParticle,
    newerAge,
    newerRadiusPx,
    headOnFreeField
  );
  float tailSampleTime = uFieldTime - olderAge;
  float headSampleTime = uFieldTime - newerAge;
  bool fieldRecycled = tailOnFreeField
    && headOnFreeField
    && fieldCycleIndex(id, tailSampleTime) != fieldCycleIndex(id, headSampleTime);
  if (fieldRecycled) tail = head;
  if (
    sparkParticle
    && sparkCyclePhase(sparkId, uFieldTime - olderAge) > sparkCyclePhase(sparkId, uFieldTime - newerAge)
  ) {
    tail = head;
  }

  float logoRadiusPx = max(LOGO_RADIUS_MIN_PX, uResolution.y * LOGO_RADIUS_SCALE) * uLogoParticleSize;
  float radiusPx = !logoParticle || uRejoining > 0.5
    ? newerRadiusPx
    : mix(
      newerRadiusPx,
      logoRadiusPx,
      formationTravelEase(currentLocalFormation, id)
    );
  float densityOpacity = 1.0;
  float particleOpacity = logoParticle ? 1.0 : sparkParticle ? 1.0 : 0.72;
  if (!sparkParticle) {
    float roleOpacityBlend = smoothstep(0.0, 0.18, uFormation);
    if (uRejoining > 0.5) {
      roleOpacityBlend *= 1.0 - smoothstep(0.55, 0.95, uRejoinProgress);
    }
    particleOpacity = mix(
      sourceParticleOpacity,
      particleOpacity,
      roleOpacityBlend
    );
  }
  float lifeFade = 1.0;
  if (!sparkParticle) {
    if (logoParticle && uRejoining > 0.5) {
      lifeFade = mix(
        1.0,
        fieldLife(id, uFieldTime),
        smoothstep(0.55, 1.0, uRejoinProgress)
      ) * rejoinCrossFade(index, id, uRejoinProgress);
    } else if (logoParticle && currentLocalFormation > 0.0) {
      lifeFade = smoothstep(0.0, 0.32, currentLocalFormation);
    } else if (logoParticle) {
      // An un-engaged pool comet would otherwise render at its virtual field
      // life: visible and stationary the instant the pool starts drawing.
      lifeFade = 0.0;
    } else {
      lifeFade = fieldLife(id, uFieldTime);
    }
  }
  float shimmerId = sparkParticle ? sparkId : id;
  float opacity = (0.88 + 0.12 * sin(uFieldTime * 2.0 + shimmerId))
    * particleOpacity
    * densityOpacity
    * lifeFade;
  if (sparkParticle) opacity *= sparkOpacity(sparkId, uFieldTime - newerAge);
  float flicker = pow(0.5 + 0.5 * sin(uFieldTime * 23.0 + sparkId * 1.73), 4.0);
  float sparkFlicker = sparkParticle ? 0.92 + flicker * 0.24 : 1.0;
  float eventMember = mod(max(sparkId - EVENT_SPARK_START, 0.0), EVENT_GROUP_SIZE);
  bool surfaceEffect = sparkParticle
    && sparkId >= EVENT_SPARK_START
    && currentSparkKind > 0.5
    && eventMember < 0.5;
  bool outerSolarContourPoint = (
    index <= 20
    || (index >= 36 && index <= 46)
    || index >= 79
  )
    && index % 2 == 0;
  bool centerSolarContourPoint = (
    (index >= 21 && index <= 35)
    || (index >= 47 && index <= 78)
  )
    && index % 3 == 0;
  bool solarContourPoint = logoParticle
    && (
      outerSolarContourPoint
      || centerSolarContourPoint
    );
  bool solarSurface = solarContourPoint
    && segmentIndex == 0
    && currentLocalFormation > 0.16
    && (uRejoining < 0.5 || uRejoinProgress < 0.34);

  if (solarSurface) {
    float solarCenterRadiusPx;
    bool solarCenterOnFreeField;
    vec2 solarCenter = sampleParticlePath(
      index,
      id,
      sparkId,
      logoParticle,
      sparkParticle,
      0.0,
      solarCenterRadiusPx,
      solarCenterOnFreeField
    );
    vec2 solarTarget = LOGO_POINTS[index] * uLogoScale;
    vec2 solarOutward = solarTarget / max(length(solarTarget), 0.00001);
    float solarSeed = hash11(id * 11.73 + 4.9);
    float solarStartProgress = formationOrder(id) * uFormationStagger
      + 0.16 * (1.0 - uFormationStagger);
    float solarStartTime = uFormationStartFieldTime
      + solarStartProgress * uFormationDuration;
    float solarAge = max(0.0, uFieldTime - solarStartTime);
    float eruptionDuration = mix(4.8, 8.6, hash11(id * 23.17 + 6.3)) / uEruptionCycleSpeed;
    float eruptionDelay = mix(0.45, 3.6, solarSeed);
    float eruptionCycle = max(0.0, solarAge - eruptionDelay) / eruptionDuration;
    float eruptionIndex = floor(eruptionCycle);
    float eruptionPhase = fract(eruptionCycle);
    float eruptionChance = step(
      1.0 - uEruptionFrequency,
      hash11(id * 31.71 + eruptionIndex * 17.13)
    );
    float eruptionEnvelope = smoothstep(0.0, 0.16, eruptionPhase)
      * (1.0 - smoothstep(0.42, 0.96, eruptionPhase))
      * eruptionChance
      * smoothstep(0.82, 1.0, currentLocalFormation);
    float eruptionVariant = hash11(id * 43.11 + eruptionIndex * 29.7);
    float weatherTime = solarAge
      * uWeatherSpeed
      / mix(3.8, 7.2, hash11(id * 37.13 + 9.7))
      + solarSeed * 3.0;
    float weatherScale = temporalNoise(id * 29.41 + 3.6, weatherTime);
    float solarGrowth = smoothstep(0.16, 0.88, currentLocalFormation);
    float solarGrowthScale = mix(0.08, 1.0, solarGrowth);
    float solarRadiusPx = uResolution.y
      * 0.108
      * uFireScale
      * solarGrowthScale
      * mix(1.0 - 0.26 * uWeatherVariation, 1.0 + 0.26 * uWeatherVariation, weatherScale);
    float solarPaddingPx = solarRadiusPx
      * mix(1.45, 2.75 * uEruptionScale, eruptionEnvelope)
      + 4.0;
    vec2 corner = QUAD[cornerIndex];
    vec2 localPx = vec2(corner.x * 2.0 - 1.0, corner.y) * solarPaddingPx;
    vec2 solarCenterPx = solarCenter * (0.5 * uResolution.y) + 0.5 * uResolution;
    vec2 positionPx = solarCenterPx + localPx;
    vec2 clip = positionPx / uResolution * 2.0 - 1.0;
    float solarVisibility = smoothstep(0.16, 0.78, currentLocalFormation);
    if (uRejoining > 0.5) {
      solarVisibility *= 1.0 - smoothstep(0.0, 0.32, uRejoinProgress);
    }

    gl_Position = vec4(clip, 0.0, 1.0);
    vLocalPx = localPx;
    vLengthPx = 0.0;
    vRadiusPx = 0.0;
    vOpacity = opacity * solarVisibility;
    vTrailProgressStart = eruptionVariant;
    vIsHead = 0.0;
    vIsSpark = 0.0;
    vSparkKind = eruptionPhase;
    vSparkFlicker = eruptionEnvelope;
    vIsSurfaceEffect = 2.0;
    vEffectProgress = solarAge * uFireSpeed * mix(0.38, 0.66, solarSeed)
      + solarSeed;
    vEffectOutward = solarOutward;
    vEffectRadiusPx = solarRadiusPx;
    vEffectSeed = solarSeed;
    return;
  }

  if (surfaceEffect) {
    int effectAnchorIndex = sparkAnchorIndex(sparkId, uFieldTime);
    vec2 effectCenter = SPARK_ANCHOR_POINTS[effectAnchorIndex] * uLogoScale;
    vec2 effectOutward = effectCenter / max(length(effectCenter), 0.00001);
    effectCenter += logoOffsetWorld();
    float effectProgress = clamp(
      sparkCyclePhase(sparkId, uFieldTime) / sparkActiveShare(currentSparkKind),
      0.0,
      1.0
    );
    float effectSize = sparkSizeScale(sparkId, uFieldTime);
    float effectRadiusPx = uResolution.y
      * (currentSparkKind < 1.5 ? 0.055 : 0.11)
      * effectSize;
    float effectPaddingPx = effectRadiusPx + 4.0;
    vec2 corner = QUAD[cornerIndex];
    vec2 localPx = vec2(corner.x * 2.0 - 1.0, corner.y) * effectPaddingPx;
    vec2 effectCenterPx = effectCenter * (0.5 * uResolution.y) + 0.5 * uResolution;
    vec2 positionPx = effectCenterPx + localPx;
    vec2 clip = positionPx / uResolution * 2.0 - 1.0;

    gl_Position = vec4(clip, 0.0, 1.0);
    vLocalPx = localPx;
    vLengthPx = 0.0;
    vRadiusPx = 0.0;
    vOpacity = opacity * (segmentIndex == TRAIL_SEGMENT_COUNT - 1 ? 1.0 : 0.0);
    vTrailProgressStart = 0.0;
    vIsHead = 0.0;
    vIsSpark = 1.0;
    vSparkKind = currentSparkKind;
    vSparkFlicker = sparkFlicker;
    vIsSurfaceEffect = 1.0;
    vEffectProgress = effectProgress;
    vEffectOutward = effectOutward;
    vEffectRadiusPx = effectRadiusPx;
    vEffectSeed = sparkCycleRandom(sparkId, uFieldTime, 59.1);
    return;
  }

  vec2 headPx = head * (0.5 * uResolution.y) + 0.5 * uResolution;
  vec2 tailPx = tail * (0.5 * uResolution.y) + 0.5 * uResolution;
  vec2 deltaPx = headPx - tailPx;
  float segmentLengthPx = length(deltaPx);
  vec2 along = segmentLengthPx > 0.001 ? deltaPx / segmentLengthPx : vec2(1.0, 0.0);
  vec2 across = vec2(-along.y, along.x);
  float paddingPx = radiusPx * (sparkParticle ? 4.5 : 4.0) + 1.0;
  vec2 corner = QUAD[cornerIndex];
  float localAlongPx = mix(-paddingPx, segmentLengthPx + paddingPx, corner.x);
  float localAcrossPx = corner.y * paddingPx;
  vec2 positionPx = tailPx + along * localAlongPx + across * localAcrossPx;
  vec2 clip = positionPx / uResolution * 2.0 - 1.0;

  gl_Position = vec4(clip, 0.0, 1.0);
  vLocalPx = vec2(localAlongPx, localAcrossPx);
  vLengthPx = segmentLengthPx;
  vRadiusPx = radiusPx;
  float segmentVisible = segmentLengthPx > 0.001 || segmentIndex == TRAIL_SEGMENT_COUNT - 1
    ? 1.0
    : 0.0;
  vOpacity = opacity * segmentVisible;
  vTrailProgressStart = segmentStart;
  vIsHead = segmentIndex == TRAIL_SEGMENT_COUNT - 1 ? 1.0 : 0.0;
  vIsSpark = sparkParticle ? 1.0 : 0.0;
  vSparkKind = currentSparkKind;
  vSparkFlicker = sparkFlicker;
  vIsSurfaceEffect = 0.0;
  vEffectProgress = 0.0;
  vEffectOutward = vec2(0.0, 1.0);
  vEffectRadiusPx = 0.0;
  vEffectSeed = 0.0;
}`}var Hh=`#version 300 es
precision highp float;

in vec2 vLocalPx;
flat in float vLengthPx;
flat in float vRadiusPx;
flat in float vOpacity;
flat in float vTrailProgressStart;
flat in float vIsHead;
flat in float vIsSpark;
flat in float vSparkKind;
flat in float vSparkFlicker;
flat in float vIsSurfaceEffect;
flat in float vEffectProgress;
flat in vec2 vEffectOutward;
flat in float vEffectRadiusPx;
flat in float vEffectSeed;

uniform float uSparkBrightness;
uniform float uSurfaceEffects;
uniform float uFireIntensity;
uniform float uFireTurbulence;
uniform float uFlameHeight;
uniform float uCoronaMist;
uniform float uCurlingWisps;
uniform float uHotRim;
uniform float uEruptionScale;
uniform float uEruptionIntensity;
uniform float uEruptionParticles;

out vec4 outColor;

float fragmentHash(float value) {
  return fract(sin(value * 127.1) * 43758.5453);
}

float fragmentNoise(vec2 point) {
  vec2 cell = floor(point);
  vec2 local = fract(point);
  vec2 blend = local * local * (3.0 - 2.0 * local);
  float lowerLeft = fragmentHash(dot(cell, vec2(127.1, 311.7)));
  float lowerRight = fragmentHash(dot(cell + vec2(1.0, 0.0), vec2(127.1, 311.7)));
  float upperLeft = fragmentHash(dot(cell + vec2(0.0, 1.0), vec2(127.1, 311.7)));
  float upperRight = fragmentHash(dot(cell + vec2(1.0, 1.0), vec2(127.1, 311.7)));
  return mix(
    mix(lowerLeft, lowerRight, blend.x),
    mix(upperLeft, upperRight, blend.x),
    blend.y
  );
}

void main() {
  if (vIsSurfaceEffect > 0.5) {
    if (vOpacity <= 0.001) discard;
    float effectDistance = length(vLocalPx);
    vec2 effectDirection = vLocalPx / max(effectDistance, 0.001);

    if (vIsSurfaceEffect > 1.5) {
      vec2 fireTangent = vec2(-vEffectOutward.y, vEffectOutward.x);
      float fireRadius = max(vEffectRadiusPx, 1.0);
      float outwardDistance = dot(vLocalPx, vEffectOutward) / fireRadius;
      float sidewaysDistance = dot(vLocalPx, fireTangent) / fireRadius;
      float phase = vEffectProgress * 6.2831853 + vEffectSeed * 19.0;
      float eruption = vSparkFlicker;
      float flowNoise = fragmentNoise(
        vec2(
          sidewaysDistance * 3.4 + vEffectSeed * 11.0,
          outwardDistance * 2.2 - phase * 0.42
        )
      );
      float detailNoise = fragmentNoise(
        vec2(
          sidewaysDistance * 7.7 - phase * 0.31 + vEffectSeed * 23.0,
          outwardDistance * 5.4 - phase * 0.92
        )
      );
      float turbulence = flowNoise * 0.64 + detailNoise * 0.36;
      float turbulentSidewaysDistance = sidewaysDistance
        + (turbulence - 0.5)
          * 0.22
          * uFireTurbulence
          * smoothstep(-0.08, 0.9, outwardDistance);
      float slowGust = (
        sin(phase * 0.37 + vEffectSeed * 11.0)
        + 0.52 * sin(phase * 0.19 - vEffectSeed * 17.0)
      ) / 1.52;
      float flameHeight = 0.88
        + 0.22 * sin(phase)
        + 0.11 * sin(phase * 1.73 + vEffectSeed * 7.0)
        + slowGust * 0.09
        + eruption * mix(0.28, 0.58, vSparkKind);
      flameHeight *= uFlameHeight;
      float outwardProgress = clamp(
        (outwardDistance + 0.08) / max(flameHeight + 0.08, 0.001),
        0.0,
        1.0
      );
      float sway = (
        sin(phase * 1.31 + outwardProgress * 5.2) * 0.18
        + sin(phase * 0.73 - outwardProgress * 8.1 + vEffectSeed * 13.0) * 0.08
        + slowGust * outwardProgress * 0.11
      ) * outwardProgress * outwardProgress;
      float flameWidth = mix(0.48, 0.025, smoothstep(0.0, 1.0, outwardProgress));
      float mainFlame = 1.0 - smoothstep(
        flameWidth,
        flameWidth + 0.14,
        abs(turbulentSidewaysDistance - sway)
      );
      float mainVertical = smoothstep(-0.2, -0.015, outwardDistance)
        * (1.0 - smoothstep(flameHeight * 0.58, flameHeight, outwardDistance));
      float mainBreakup = mix(0.22, 1.0, smoothstep(0.16, 0.86, turbulence));
      mainFlame *= mainVertical * mainBreakup;

      float secondaryOffset = mix(-0.36, 0.36, fract(vEffectSeed * 17.23))
        + sin(phase * 0.31 + vEffectSeed * 13.0) * 0.14;
      float secondaryHeight = 0.5
        + 0.2 * (0.5 + 0.5 * sin(phase * 1.47 + vEffectSeed * 31.0));
      secondaryHeight *= uFlameHeight;
      float secondaryProgress = clamp(
        (outwardDistance + 0.04) / max(secondaryHeight + 0.04, 0.001),
        0.0,
        1.0
      );
      float secondarySway = secondaryOffset
        + sin(phase * 1.83 - secondaryProgress * 5.7) * 0.07 * secondaryProgress;
      float secondaryWidth = mix(0.2, 0.018, secondaryProgress);
      float secondaryFlame = 1.0 - smoothstep(
        secondaryWidth,
        secondaryWidth + 0.1,
        abs(turbulentSidewaysDistance - secondarySway)
      );
      secondaryFlame *= smoothstep(-0.15, 0.0, outwardDistance)
        * (1.0 - smoothstep(secondaryHeight * 0.54, secondaryHeight, outwardDistance));

      float tertiaryOffset = -secondaryOffset * 0.68
        + sin(phase * 0.23 - vEffectSeed * 19.0) * 0.09;
      float tertiaryHeight = 0.28
        + 0.22 * (0.5 + 0.5 * sin(phase * 2.13 - vEffectSeed * 27.0));
      tertiaryHeight *= uFlameHeight;
      float tertiaryProgress = clamp(
        outwardDistance / max(tertiaryHeight, 0.001),
        0.0,
        1.0
      );
      float tertiarySway = tertiaryOffset
        + sin(phase * 2.37 + tertiaryProgress * 4.9) * 0.06 * tertiaryProgress;
      float tertiaryWidth = mix(0.16, 0.014, tertiaryProgress);
      float tertiaryFlame = 1.0 - smoothstep(
        tertiaryWidth,
        tertiaryWidth + 0.09,
        abs(turbulentSidewaysDistance - tertiarySway)
      );
      tertiaryFlame *= smoothstep(-0.12, 0.02, outwardDistance)
        * (1.0 - smoothstep(tertiaryHeight * 0.5, tertiaryHeight, outwardDistance));

      float eruptionPhase = vSparkKind;
      float eruptionVariant = vTrailProgressStart;
      float plumeHeight = mix(1.45, 2.18, eruptionVariant) * uEruptionScale;
      float plumeReach = plumeHeight * smoothstep(0.02, 0.34, eruptionPhase);
      float plumeProgress = clamp(
        (outwardDistance + 0.02) / max(plumeReach, 0.001),
        0.0,
        1.0
      );
      float plumeLean = mix(-0.34, 0.34, eruptionVariant);
      float plumeSway = plumeLean * plumeProgress
        + (
          sin(phase * 1.37 + plumeProgress * 7.1 + vEffectSeed * 33.0) * 0.15
          + sin(phase * 2.11 - plumeProgress * 4.7 + eruptionVariant * 19.0) * 0.07
        ) * plumeProgress * plumeProgress;
      float outerPlumeWidth = mix(
        0.38,
        0.045,
        smoothstep(0.0, 1.0, plumeProgress)
      );
      float corePlumeWidth = outerPlumeWidth * mix(0.32, 0.2, plumeProgress);
      float outerPlume = 1.0 - smoothstep(
        outerPlumeWidth,
        outerPlumeWidth + 0.15,
        abs(turbulentSidewaysDistance - plumeSway)
      );
      float corePlume = 1.0 - smoothstep(
        corePlumeWidth,
        corePlumeWidth + 0.075,
        abs(turbulentSidewaysDistance - plumeSway)
      );
      float plumeBreakup = mix(
        0.12,
        1.0,
        smoothstep(
          0.14,
          0.9,
          0.5
            + 0.5
              * sin(
                sidewaysDistance * 19.0
                + plumeProgress * 13.0
                - phase * 4.2
                + vEffectSeed * 47.0
              )
        )
      );
      float plumeVertical = smoothstep(-0.12, 0.03, outwardDistance)
        * (1.0 - smoothstep(plumeReach * 0.68, plumeReach, outwardDistance));
      outerPlume *= plumeVertical * plumeBreakup * eruption;
      corePlume *= plumeVertical * mix(0.62, 1.0, plumeBreakup) * eruption;

      float branchStart = mix(0.28, 0.46, eruptionVariant);
      float branchProgress = clamp(
        (plumeProgress - branchStart) / max(1.0 - branchStart, 0.001),
        0.0,
        1.0
      );
      float branchDirection = mix(-1.0, 1.0, step(0.5, eruptionVariant));
      float branchCenter = plumeSway
        + branchDirection * branchProgress * mix(0.26, 0.48, eruptionVariant);
      float branchWidth = mix(0.2, 0.025, branchProgress);
      float plumeBranch = 1.0 - smoothstep(
        branchWidth,
        branchWidth + 0.1,
        abs(turbulentSidewaysDistance - branchCenter)
      );
      plumeBranch *= smoothstep(0.0, 0.18, branchProgress)
        * (1.0 - smoothstep(0.76, 1.0, branchProgress))
        * plumeBreakup
        * eruption;

      float tipProgress = 0.76;
      float tipCenter = plumeLean * tipProgress
        + (
          sin(phase * 1.37 + tipProgress * 7.1 + vEffectSeed * 33.0) * 0.15
          + sin(phase * 2.11 - tipProgress * 4.7 + eruptionVariant * 19.0) * 0.07
        ) * tipProgress * tipProgress;
      vec2 plumeTip = vec2(
        sidewaysDistance - tipCenter,
        outwardDistance - plumeReach * tipProgress
      );
      float tipAngle = atan(plumeTip.y, plumeTip.x);
      float crownLobes = 0.82
        + 0.18 * sin(tipAngle * 5.0 + phase * 2.7 + eruptionVariant * 23.0);
      float crownRadius = mix(0.12, 0.22, eruptionVariant) * crownLobes;
      float eruptionCrown = (
        1.0 - smoothstep(crownRadius * 0.55, crownRadius, length(plumeTip))
      )
        * smoothstep(0.16, 0.34, eruptionPhase)
        * (1.0 - smoothstep(0.68, 0.95, eruptionPhase))
        * step(0.001, eruption);

      float eruptionParticles = 0.0;
      float eruptionActive = step(0.001, eruption);
      vec2 firePoint = vec2(sidewaysDistance, outwardDistance);
      for (int emberIndex = 0; emberIndex < 7; emberIndex++) {
        float emberId = float(emberIndex);
        float emberSeed = fragmentHash(
          vEffectSeed * 73.1
          + eruptionVariant * 41.7
          + emberId * 19.37
        );
        float emberStart = mix(
          0.16,
          0.42,
          fragmentHash(emberSeed * 13.9 + emberId)
        );
        float emberDuration = mix(
          0.38,
          0.62,
          fragmentHash(emberSeed * 29.1 + 2.7)
        );
        float emberAge = (eruptionPhase - emberStart) / emberDuration;
        float emberLife = smoothstep(0.0, 0.08, emberAge)
          * (1.0 - smoothstep(0.45, 1.0, emberAge))
          * step(0.0, emberAge)
          * eruptionActive;
        float emberSideVelocity = mix(
          -0.82,
          0.82,
          fragmentHash(emberSeed * 31.7 + 4.1)
        );
        float emberUpVelocity = mix(
          1.0,
          1.72,
          fragmentHash(emberSeed * 47.3 + 8.6)
        );
        float emberGravity = mix(
          0.42,
          0.78,
          fragmentHash(emberSeed * 61.9 + 3.2)
        );
        float safeEmberAge = max(emberAge, 0.0);
        float dragTravel = (
          1.0 - exp(-2.2 * safeEmberAge)
        ) / (1.0 - exp(-2.2));
        vec2 emberPosition = vec2(
          plumeLean * 0.18
            + emberSideVelocity * dragTravel
            + sin(safeEmberAge * 5.0 + emberSeed * 17.0) * 0.035,
          0.34
            + emberUpVelocity * dragTravel
            - emberGravity * safeEmberAge * safeEmberAge
        );
        vec2 emberVelocity = vec2(
          emberSideVelocity * exp(-1.4 * safeEmberAge),
          emberUpVelocity * exp(-1.2 * safeEmberAge)
            - 2.0 * emberGravity * safeEmberAge
        );
        vec2 emberDirection = emberVelocity / max(length(emberVelocity), 0.001);
        float emberTailLength = mix(
          0.08,
          0.24,
          fragmentHash(emberSeed * 79.1 + 6.4)
        );
        vec2 emberTail = emberPosition - emberDirection * emberTailLength;
        vec2 emberSegment = emberPosition - emberTail;
        vec2 emberOffset = firePoint - emberTail;
        float emberAlong = clamp(
          dot(emberOffset, emberSegment) / max(dot(emberSegment, emberSegment), 0.0001),
          0.0,
          1.0
        );
        float emberDistance = length(
          emberOffset - emberSegment * emberAlong
        );
        float emberRadius = mix(
          0.022,
          0.045,
          fragmentHash(emberSeed * 97.3 + 5.8)
        );
        float emberLight = 1.0 - smoothstep(
          emberRadius,
          emberRadius + 0.035,
          emberDistance
        );
        eruptionParticles += emberLight
          * emberLife
          * mix(0.58, 1.0, emberAlong);
      }

      float rollingHeat = mix(
        turbulence,
        0.5
          + 0.5
            * sin(
              sidewaysDistance * 9.0
              - outwardDistance * 7.0
              + phase * 3.4
              + vEffectSeed * 29.0
            ),
        0.34
      );
      float baseCorona = (1.0 - smoothstep(0.16, 0.62, abs(sidewaysDistance)))
        * (1.0 - smoothstep(0.12, 0.4, abs(outwardDistance - 0.02)));
      float surfaceHeat = (
        1.0
          - smoothstep(
            0.18,
            0.68,
            length(vec2(sidewaysDistance, outwardDistance * 1.25))
          )
      ) * mix(0.38, 1.0, rollingHeat);
      float coronaEnvelope = smoothstep(-0.2, 0.02, outwardDistance)
        * (1.0 - smoothstep(0.42, 1.22, outwardDistance))
        * (1.0 - smoothstep(0.38, 1.02, abs(sidewaysDistance)));
      float coronaMist = coronaEnvelope
        * mix(0.14, 1.0, smoothstep(0.22, 0.82, turbulence));
      vec2 curlCenter = vec2(
        sin(phase * 0.29 + vEffectSeed * 31.0) * 0.28,
        0.48 + sin(phase * 0.17 - vEffectSeed * 13.0) * 0.18
      );
      float curlRadius = 0.2
        + 0.08 * (0.5 + 0.5 * sin(phase * 0.21 + vEffectSeed * 17.0));
      vec2 curlLocal = vec2(
        turbulentSidewaysDistance - curlCenter.x,
        (outwardDistance - curlCenter.y) * 0.82
      );
      float curlDistance = abs(length(curlLocal) - curlRadius);
      float curlActivation = smoothstep(
        0.42,
        0.82,
        0.5 + 0.5 * sin(phase * 0.13 + vEffectSeed * 41.0)
      );
      float curlingWisp = (
        1.0 - smoothstep(0.025, 0.11, curlDistance)
      )
        * curlActivation
        * mix(0.24, 1.0, detailNoise)
        * smoothstep(-0.08, 0.12, outwardDistance);
      float hotRim = (
        1.0 - smoothstep(0.055, 0.24, abs(outwardDistance + 0.01))
      )
        * (1.0 - smoothstep(0.42, 0.94, abs(sidewaysDistance)))
        * mix(0.5, 1.0, turbulence);
      float fireFlicker = 0.76
        + 0.24 * (0.5 + 0.5 * sin(phase * 3.67 + vEffectSeed * 37.0));
      float normalFire = (
        mainFlame * 0.21
        + secondaryFlame * 0.13
        + tertiaryFlame * 0.1
        + baseCorona * 0.07
        + surfaceHeat * 0.06
        + coronaMist * 0.045 * uCoronaMist
        + curlingWisp * 0.085 * uCurlingWisps
        + hotRim * 0.055 * uHotRim
      ) * uFireIntensity;
      float eruptionFire = (
        outerPlume * 0.2
        + corePlume * 0.32
        + plumeBranch * 0.17
        + eruptionCrown * 0.18
      ) * uEruptionIntensity;
      float fireLight = (
        normalFire
        + eruptionFire
        + eruptionParticles * 0.42 * uEruptionParticles
      ) * fireFlicker * vOpacity;

      if (fireLight <= 0.001) discard;
      outColor = vec4(vec3(fireLight), 1.0);
      return;
    }

    float effectEase = 1.0 - (1.0 - vEffectProgress) * (1.0 - vEffectProgress);
    float effectLight;

    if (vSparkKind < 1.5) {
      float rotation = vEffectSeed * 6.2831853 + vEffectProgress * 0.34;
      vec2 primaryAxis = vec2(cos(rotation), sin(rotation));
      vec2 secondaryAxis = vec2(-primaryAxis.y, primaryAxis.x);
      float primaryAlong = abs(dot(vLocalPx, primaryAxis));
      float primaryAcross = abs(dot(vLocalPx, secondaryAxis));
      float secondaryAlong = abs(dot(vLocalPx, secondaryAxis));
      float secondaryAcross = abs(dot(vLocalPx, primaryAxis));
      float primarySpike = (1.0 - smoothstep(0.8, vEffectRadiusPx * 0.042 + 1.2, primaryAcross))
        * (1.0 - smoothstep(vEffectRadiusPx * 0.1, vEffectRadiusPx * 0.68, primaryAlong));
      float secondarySpike = (1.0 - smoothstep(0.8, vEffectRadiusPx * 0.06 + 1.4, secondaryAcross))
        * (1.0 - smoothstep(vEffectRadiusPx * 0.08, vEffectRadiusPx * 0.46, secondaryAlong));
      float core = 1.0 - smoothstep(
        vEffectRadiusPx * 0.035,
        vEffectRadiusPx * mix(0.2, 0.1, vEffectProgress) + 1.0,
        effectDistance
      );
      float bloom = 1.0 - smoothstep(
        vEffectRadiusPx * 0.05,
        vEffectRadiusPx * mix(0.36, 0.54, effectEase),
        effectDistance
      );
      float angle = atan(vLocalPx.y, vLocalPx.x);
      float unevenness = mix(
        0.62,
        1.0,
        0.5 + 0.5 * sin(angle * 7.0 + effectDistance * 0.13 + vEffectSeed * 19.0)
      );
      float normalizedDistance = effectDistance / max(vEffectRadiusPx, 1.0);
      float coronaPattern = 0.5
        + 0.5 * sin(angle * 13.0 + vEffectSeed * 37.0 + vEffectProgress * 4.2);
      coronaPattern *= 0.68
        + 0.32 * sin(angle * 21.0 - vEffectSeed * 17.0 - vEffectProgress * 2.8);
      float coronaRays = pow(max(coronaPattern, 0.0), 7.0)
        * smoothstep(0.06, 0.14, normalizedDistance)
        * (1.0 - smoothstep(0.24, 0.58, normalizedDistance));
      float glintRadius = vEffectRadiusPx
        * (0.2 + 0.07 * sin(angle * 5.0 + vEffectSeed * 29.0));
      float glintBand = 1.0 - smoothstep(
        0.8,
        3.0,
        abs(effectDistance - glintRadius)
      );
      float glintPattern = pow(
        max(
          0.0,
          0.5 + 0.5 * sin(angle * 17.0 + vEffectSeed * 43.0 + vEffectProgress * 5.4)
        ),
        14.0
      );
      float hotGlints = glintBand * glintPattern;
      float haloRadius = vEffectRadiusPx * mix(0.08, 0.52, effectEase);
      float haloWidth = vEffectRadiusPx * mix(0.08, 0.025, vEffectProgress);
      float halo = 1.0 - smoothstep(
        haloWidth,
        haloWidth * 2.6 + 1.0,
        abs(effectDistance - haloRadius)
      );
      float haloBreakup = mix(
        0.18,
        1.0,
        0.5 + 0.5 * sin(angle * 9.0 - vEffectSeed * 31.0)
      );
      float haloOutward = smoothstep(-0.62, 0.18, dot(effectDirection, vEffectOutward));
      float pulse = sin(clamp(vEffectProgress, 0.0, 1.0) * 3.14159265);
      effectLight = (
        core * 0.9
        + primarySpike * 0.26
        + secondarySpike * 0.17
        + bloom * unevenness * 0.12
        + coronaRays * 0.25
        + hotGlints * 0.42
        + halo * haloBreakup * haloOutward * 0.18
      ) * mix(0.76, 1.0, pulse);
    } else {
      float waveRadius = mix(vEffectRadiusPx * 0.08, vEffectRadiusPx * 0.9, effectEase);
      float bandDistance = abs(effectDistance - waveRadius);
      float bandWidth = vEffectRadiusPx * mix(0.18, 0.1, vEffectProgress);
      float haze = 1.0 - smoothstep(
        bandWidth,
        bandWidth * 2.8 + 2.0,
        bandDistance
      );
      float angle = atan(vLocalPx.y, vLocalPx.x);
      float breakup = 0.5
        + 0.5 * sin(angle * 11.0 + effectDistance * 0.09 + vEffectSeed * 23.0);
      breakup = mix(0.28, 1.0, smoothstep(0.12, 0.88, breakup));
      float pinpricks = pow(
        max(0.0, sin(angle * 17.0 + vEffectSeed * 31.0)),
        18.0
      ) * haze;
      float outwardMask = smoothstep(-0.28, 0.34, dot(effectDirection, vEffectOutward));
      vec2 effectTangent = vec2(-vEffectOutward.y, vEffectOutward.x);
      float flareLean = mix(-0.72, 0.72, fract(vEffectSeed * 17.31));
      vec2 flareAxis = normalize(vEffectOutward + effectTangent * flareLean);
      vec2 flareTangent = vec2(-flareAxis.y, flareAxis.x);
      vec2 loopCenter = flareAxis
        * vEffectRadiusPx
        * mix(0.16, 0.3, effectEase);
      vec2 loopLocal = vLocalPx - loopCenter;
      float loopAlong = dot(loopLocal, flareAxis);
      float loopAcross = dot(loopLocal, flareTangent);
      float loopDistance = length(vec2(loopAcross, loopAlong * 0.76));
      float loopRadius = vEffectRadiusPx * mix(0.1, 0.32, effectEase);
      float loopWidth = vEffectRadiusPx * mix(0.065, 0.025, vEffectProgress);
      float prominence = 1.0 - smoothstep(
        loopWidth,
        loopWidth * 2.8 + 1.0,
        abs(loopDistance - loopRadius)
      );
      float loopOpening = smoothstep(
        -0.38,
        0.18,
        dot(loopLocal / max(length(loopLocal), 0.001), flareAxis)
      );
      float loopBreakup = mix(
        0.2,
        1.0,
        smoothstep(
          0.12,
          0.88,
          0.5 + 0.5 * sin(angle * 7.0 + effectDistance * 0.08 + vEffectSeed * 41.0)
        )
      );
      float outwardDistance = dot(vLocalPx, flareAxis) / max(vEffectRadiusPx, 1.0);
      float sidewaysDistance = dot(vLocalPx, flareTangent) / max(vEffectRadiusPx, 1.0);
      float flareCurve = sidewaysDistance
        - flareLean * 0.22 * outwardDistance * outwardDistance;
      float flareTongue = (1.0 - smoothstep(0.014, 0.07, abs(flareCurve)))
        * smoothstep(0.02, 0.12, outwardDistance)
        * (1.0 - smoothstep(0.42, 0.82, outwardDistance));
      float flareVariant = fract(vEffectSeed * 53.17);
      float prominenceWeight = mix(0.22, 0.52, smoothstep(0.18, 0.72, flareVariant));
      float tongueWeight = mix(0.5, 0.18, smoothstep(0.28, 0.82, flareVariant));
      effectLight = (
        haze * breakup * 0.28
        + pinpricks * 0.24
        + prominence * loopOpening * loopBreakup * prominenceWeight
        + flareTongue * tongueWeight
      ) * outwardMask;
    }

    float effectStrength = 0.9 * uSurfaceEffects;
    effectLight *= vOpacity * vSparkFlicker * effectStrength;
    if (effectLight <= 0.001) discard;
    outColor = vec4(vec3(effectLight), 1.0);
    return;
  }

  float segmentX = clamp(vLocalPx.x, 0.0, vLengthPx);
  float segmentDistance = length(vec2(vLocalPx.x - segmentX, vLocalPx.y));
  float segmentProgress = vLengthPx > 0.001 ? clamp(vLocalPx.x / vLengthPx, 0.0, 1.0) : 1.0;
  float trailProgress = vTrailProgressStart
    + segmentProgress / float(8);
  float trailWidth = vRadiusPx * mix(0.22, 0.72, trailProgress);
  float trailCore = 1.0 - smoothstep(trailWidth, trailWidth + 1.0, segmentDistance);
  float trailHalo = 1.0 - smoothstep(trailWidth, trailWidth * 2.4 + 1.0, segmentDistance);

  float headDistance = length(vec2(vLocalPx.x - vLengthPx, vLocalPx.y));
  float headCore = 1.0 - smoothstep(vRadiusPx, vRadiusPx + 1.0, headDistance);
  float headHalo = 1.0 - smoothstep(vRadiusPx, vRadiusPx * 4.0 + 1.0, headDistance);
  float cometTaper = trailProgress * trailProgress;
  float cometLight = (headCore + headHalo * 0.36) * vIsHead
    + trailCore * 0.68 * cometTaper
    + trailHalo * 0.12 * cometTaper;

  float needleMask = 1.0 - step(0.5, vSparkKind);
  float burstMask = step(0.5, vSparkKind) * (1.0 - step(1.5, vSparkKind));
  float waveMask = step(1.5, vSparkKind);
  float sparkTaper = mix(0.14, 1.0, smoothstep(0.0, 0.84, trailProgress));
  float sparkTrailWidth = max(0.65, vRadiusPx * mix(0.14, 0.38, trailProgress));
  float sparkTrailCore = 1.0 - smoothstep(
    sparkTrailWidth,
    sparkTrailWidth + 0.7,
    segmentDistance
  );
  float sparkTrailHalo = 1.0 - smoothstep(
    sparkTrailWidth,
    vRadiusPx * 2.7 + 1.0,
    segmentDistance
  );
  float sparkHeadCore = 1.0 - smoothstep(
    vRadiusPx * 0.92,
    vRadiusPx * 0.92 + 0.75,
    headDistance
  );
  float sparkHeadHalo = 1.0 - smoothstep(
    vRadiusPx * 0.8,
    vRadiusPx * 3.2 + 1.0,
    headDistance
  );
  float needleLight = (sparkHeadCore * 1.38 + sparkHeadHalo * 0.22) * vIsHead
    + sparkTrailCore * 1.12 * sparkTaper
    + sparkTrailHalo * 0.13 * sparkTaper;
  float burstLight = (sparkHeadCore * 1.62 + sparkHeadHalo * 0.22) * vIsHead
    + sparkTrailCore * 1.08 * sparkTaper
    + sparkTrailHalo * 0.12 * sparkTaper;
  float waveLight = (sparkHeadCore * 1.08 + sparkHeadHalo * 0.28) * vIsHead
    + sparkTrailCore * 0.38
    + sparkTrailHalo * 0.12;
  float sparkLight = needleLight * needleMask
    + burstLight * burstMask
    + waveLight * waveMask;
  float light = mix(cometLight, sparkLight, vIsSpark);
  float sparkStrength = (needleMask * 1.05 + burstMask * 1.25 + waveMask * 0.92)
    * vSparkFlicker;
  float outputStrength = mix(0.68, sparkStrength * uSparkBrightness, vIsSpark);

  if (light <= 0.001 || vOpacity <= 0.001) discard;
  outColor = vec4(vec3(light * vOpacity * outputStrength), 1.0);
}`,ft=.5;function Wo(e,t,a){let r=e.createShader(t);if(!r)throw Error("Could not create comet logo shader.");if(e.shaderSource(r,a),e.compileShader(r),!e.getShaderParameter(r,e.COMPILE_STATUS)){let n=e.getShaderInfoLog(r)||"Unknown comet logo shader compile error.";throw e.deleteShader(r),Error(n)}return r}function Vh(e,t){let a=Wo(e,e.VERTEX_SHADER,zh(t)),r=Wo(e,e.FRAGMENT_SHADER,Hh),n=e.createProgram();if(!n)throw Error("Could not create comet logo shader program.");if(e.attachShader(n,a),e.attachShader(n,r),e.linkProgram(n),e.deleteShader(a),e.deleteShader(r),!e.getProgramParameter(n,e.LINK_STATUS)){let o=e.getProgramInfoLog(n)||"Unknown comet logo shader link error.";throw e.deleteProgram(n),Error(o)}return n}function fp(e,t,a={}){let r=a.shape?Gr(a.shape):Ii,n=_i(r),o=document.createElement("canvas"),l=o.getContext("webgl2",{alpha:!1,antialias:!1,depth:!1,powerPreference:"low-power",premultipliedAlpha:!1,preserveDrawingBuffer:!1,stencil:!1});if(!l)throw Error("WebGL2 is required for the comet logo shader.");let i=Vh(l,r),s=l.createVertexArray();if(!s)throw l.deleteProgram(i),Error("Could not create comet logo vertex array.");let u=l.getUniformLocation(i,"uResolution"),f=l.getUniformLocation(i,"uFieldTime"),c=l.getUniformLocation(i,"uFormation"),m=l.getUniformLocation(i,"uRejoining"),g=l.getUniformLocation(i,"uRejoinProgress"),b=l.getUniformLocation(i,"uRejoinElapsed"),S=l.getUniformLocation(i,"uRejoinStartFieldTime"),v=l.getUniformLocation(i,"uRejoinStartFormation"),M=l.getUniformLocation(i,"uRejoinDuration"),y=l.getUniformLocation(i,"uFormationOrigin"),x=l.getUniformLocation(i,"uFormationStartFieldTime"),T=Object.fromEntries("FieldSpeed.FieldDepth.FieldSpread.CenterClearRadius.FieldTrailLength.FieldParticleSize.LogoScale.LogoOffsetX.LogoOffsetY.LogoParticleSize.LogoTrailLength.LogoMotion.FormationDuration.FormationStagger.CenterPreference.SparkFrequency.SparkSize.SparkBrightness.SparkTrailLength.BurstProbability.WaveProbability.SurfaceEffects.FireScale.FireIntensity.FireSpeed.FireTurbulence.FlameHeight.WeatherSpeed.WeatherVariation.CoronaMist.CurlingWisps.HotRim.EruptionFrequency.EruptionScale.EruptionIntensity.EruptionParticles.EruptionCycleSpeed.FieldAlign.FormationDirectness.FormationMaxTravel.CenterClearAspect.CenterClearSquareness.CenterClearLeak.CenterClearFalloff.CenterClearOffsetX.CenterClearOffsetY.LogoDensity.FormationEase.FormationWiggle".split(".").map(L=>[L,l.getUniformLocation(i,`u${L}`)])),R=Rh(),C=.5,w=.5,p=0,E=!1,D=(L,H)=>{let U=Math.max(1,Math.round(L*ft)),A=Math.max(1,Math.round(H*ft));o.width!==U&&(o.width=U),o.height!==A&&(o.height=A)};return D(e,t),{canvas:o,shape:r,get width(){return o.width},get height(){return o.height},resize:D,render(L,H,U){if(E)return;let A=Oh(U),ee=R.mode;R=Eh(R,L,H.hovered,A.formationDuration,A.rejoinDuration,A.formationRejoinScale,A.formationInterrupt,A.formationRejoinMargin),R.mode==="forming"&&ee!=="forming"&&(ee==="field"||R.formation<=.001)&&(C=Math.max(0,Math.min(1,H.x/Math.max(1,o.width))),w=Math.max(0,Math.min(1,H.y/Math.max(1,o.height))),p=R.fieldTimeSec),l.viewport(0,0,o.width,o.height),l.clearColor(0,0,0,1),l.clear(l.COLOR_BUFFER_BIT),l.useProgram(i),l.bindVertexArray(s),l.uniform2f(u,o.width,o.height),l.uniform1f(f,R.fieldTimeSec),l.uniform1f(c,R.formation),l.uniform1f(m,+(R.mode==="rejoining")),l.uniform1f(g,R.rejoinProgress),l.uniform1f(b,Math.max(0,R.fieldTimeSec-R.rejoinStartFieldTimeSec)),l.uniform1f(S,R.rejoinStartFieldTimeSec),l.uniform1f(v,R.rejoinStartFormation),l.uniform1f(M,A.rejoinDuration),l.uniform2f(y,C*o.width,w*o.height),l.uniform1f(x,p);let Se={FieldSpeed:A.fieldSpeed,FieldDepth:A.fieldDepth,FieldSpread:A.fieldSpread,CenterClearRadius:A.centerClearRadius*ft,FieldTrailLength:A.fieldTrailLength,FieldParticleSize:A.fieldParticleSize,LogoScale:A.logoScale,LogoOffsetX:A.logoOffsetX*ft,LogoOffsetY:A.logoOffsetY*ft,LogoParticleSize:A.logoParticleSize,LogoTrailLength:A.logoTrailLength,LogoMotion:A.logoMotion,FormationDuration:A.formationDuration,FormationStagger:A.formationStagger,CenterPreference:A.centerPreference,SparkFrequency:A.sparkFrequency,SparkSize:A.sparkSize,SparkBrightness:A.sparkBrightness,SparkTrailLength:A.sparkTrailLength,BurstProbability:A.burstProbability,WaveProbability:A.waveProbability,SurfaceEffects:A.surfaceEffects,FireScale:A.fireScale,FireIntensity:A.fireIntensity,FireSpeed:A.fireSpeed,FireTurbulence:A.fireTurbulence,FlameHeight:A.flameHeight,WeatherSpeed:A.weatherSpeed,WeatherVariation:A.weatherVariation,CoronaMist:A.coronaMist,CurlingWisps:A.curlingWisps,HotRim:A.hotRim,EruptionFrequency:A.eruptionFrequency,EruptionScale:A.eruptionScale,EruptionIntensity:A.eruptionIntensity,EruptionParticles:A.eruptionParticles,EruptionCycleSpeed:A.eruptionCycleSpeed,FieldAlign:A.fieldAlign,FormationDirectness:A.formationDirectness,FormationMaxTravel:A.formationMaxTravel,CenterClearAspect:A.centerClearAspect,CenterClearSquareness:A.centerClearSquareness,CenterClearLeak:A.centerClearLeak,CenterClearFalloff:A.centerClearFalloff,CenterClearOffsetX:A.centerClearOffsetX*ft,CenterClearOffsetY:A.centerClearOffsetY*ft,LogoDensity:A.logoDensity,FormationEase:A.formationEase,FormationWiggle:A.formationWiggle};for(let[Kt,Re]of Object.entries(Se))l.uniform1f(T[Kt]??null,Re);l.enable(l.BLEND),l.blendFunc(l.ONE,l.ONE);let we=R.mode==="field"?n.render:n.activeRender+Dh(A.logoDensity,r);l.drawArraysInstanced(l.TRIANGLES,0,48,we),l.disable(l.BLEND),l.bindVertexArray(null)},getAnimationState(){return R},dispose(){E||(E=!0,l.deleteVertexArray(s),l.deleteProgram(i))}}}var dp="@necatikcl/stripes-engine";export{el as CLICK_WAVE_TYPES,op as COMET_LOGO_BACKGROUND_POINT_COUNT,cp as COMET_LOGO_CONFIG_VERSION,G as COMET_LOGO_DEFAULTS,Ii as COMET_LOGO_DEFAULT_SHAPE,kh as COMET_LOGO_DEFAULT_SHAPE_HEIGHT,wh as COMET_LOGO_FORMATION_DURATION_SEC,Wr as COMET_LOGO_POINTS,Ph as COMET_LOGO_REJOIN_DURATION_SEC,ft as COMET_LOGO_RENDER_SCALE,Ah as COMET_LOGO_SPARK_ANCHOR_INDICES,ip as COMET_LOGO_TRAIL_SEGMENT_COUNT,Nh as CURSOR_TRAIL_TYPES,zo as DEFAULT_BACKGROUND_METEORS,fe as DEFAULT_CLICK_WAVE,Jo as DEFAULT_COMET_TRAIL,Zo as DEFAULT_DETONATION_CLICK,Xh as DEFAULT_ENGINE_CONFIG,_t as DEFAULT_FLAME_STAGGER,ve as DEFAULT_FRAMES,tt as DEFAULT_FRAMES_CONNECTION,da as DEFAULT_GRID_LINES,Yo as DEFAULT_MAGMA_CLICK,$o as DEFAULT_MAGMA_REVEAL,fa as DEFAULT_STRIPE_BORDER,et as DEFAULT_STRIPE_DOTS,Xo as DEFAULT_SUPERNOVA_CLICK,No as DEFAULT_SUPERNOVA_REVEAL,jo as DEFAULT_TIDAL_CLICK,qo as DEFAULT_TIDAL_REVEAL,dp as ENGINE_PACKAGE,Q as FULLSCREEN_VERT,Kh as SOURCE_SWITCH_MODES,Eh as advanceCometLogoAnimation,F0 as applyImageColorDensity,Zh as bandIndexForValue,X as bindRenderTarget,gc as buildContourField,Q0 as buildFrameGroups,Kl as centreToCentreConnection,eo as cometCaps,_i as cometLogoPointCounts,Dh as cometLogoPoolPointCount,Th as cometLogoRejoinWindowSec,Bi as cometLogoShapeBounds,up as cometLogoShapeFromImage,sp as cometLogoShapeFromSvg,lp as cometLogoShapeFromSvgPath,V as compileProgram,Zl as connectionsByAlpha,Rh as createCometLogoAnimationState,fp as createCometLogoTextureRenderer,Ve as createDataTexture,ah as createFramesReveal,Cn as createFullscreenQuad,Yh as createManualClock,Rr as createPingPong,bh as createProductionConfig,ss as createRealClock,rt as createRenderTarget,Rt as createSeededRng,Jh as createStripesEngine,Qh as createStripesEngineShared,sr as detonationCaps,ni as diffEngineConfig,Ye as disposeRenderTarget,ep as edgeMaskAlpha,ga as effectiveStripes,Jl as frameBoxPolygon,es as frameConnectionColor,oi as frameDashPattern,th as frameRevealT,J0 as maskFrameReadbackForContour,eh as maxCornerDistance,ao as meteorsCaps,np as migrateLegacyConfig,rl as normalizeBackgroundMeteors,Oh as normalizeCometLogoSettings,Gr as normalizeCometLogoShape,Gl as normalizeCometTrail,Ol as normalizeDetonationClick,Ke as normalizeEngineConfig,Dl as normalizeFrames,Al as normalizeFramesConnection,El as normalizeGridLines,ml as normalizeMagmaClick,pl as normalizeMagmaReveal,Rl as normalizeStripeBorder,Tl as normalizeStripeDots,fl as normalizeSupernovaClick,cl as normalizeSupernovaReveal,hl as normalizeTidalClick,dl as normalizeTidalReveal,ns as paintConnectionLines,os as paintFrameConnections,jh as paintFramesOverlay,ap as parseEngineConfig,ba as resizeRenderTarget,j0 as resolveFrameBoxes,Ql as resolveFrameConnections,xa as resolveThemedConfig,qh as sanitizeThemedConfig,tp as serializeEngineConfig,rp as serializeProductionConfig,A0 as stripeDotBandEligibility,$h as subscribeStripesStats,wt as updateDataTexture};
