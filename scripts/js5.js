//src= http://www.mathopenref.com/common/js5.js
//on page http://www.mathopenref.com/trigangle.html


function AngleMark( aPt, bPt, cPt, labl, tcs) 
{ this.type="AngleMark";
  this.a=aPt;
 this.b=bPt;
 this.c=cPt;
 this.pLabel=labl || "";
 this.numTics=(!tcs)? 0 : tcs;
 this.color=stdLineColor;
 this.font="11px sans-serif";
 this.arcThickness=1;
 this.showArc=true;
  this.showLabel=true;
  this.showDegs=true;
  this.showTics=true;
  this.showMeasure=true;
  this.manual=null;
  this.ticSpacing=0.3;
  this.ticLength=3;
  this.radius=12;
  this.labelRadius=12;
  this.measureRadius=null;
  this.autoMoveEnabled=true;
 this.visible=true;
  this.firstAngle=0;
  this.secondAngle=0;
  this.startAngle=0;
  this.degrees;
  this.radians;
  this.update=function() 
{ }
;
 this.paint=function() 
{ if(!this.visible) return;
 with(this) 
{ ticSpacing=numTics>2? 0.2 : 0.3;
 degrees=getDegrees();
  radians=toRadians(getMeasure());
 if(showMeasure) with(context) 
{ var angMeas=toRadians(degrees);
 var cnr=radius<=10? radius : radius*0.7;
 var measAngle=b.theta(a) +(angMeas/2);
 if(showArc)  
{ save();
 lineWidth=arcThickness;
 strokeStyle=toStr(color);
 translate(b.x, b.y);
 rotate( -toRadians(startAngle) );
 beginPath();
 if (degrees==90 || manual==90)  
{ moveTo(cnr, 0);
 lineTo(cnr, -cnr);
 lineTo(0, -cnr);
 }
 else 
{ arc(0,0, radius, 0, -angMeas, true);
 if( numTics>0 && showTics && (numTics*ticSpacing)<angMeas)  
{ var firstTic=(angMeas-((numTics-1)*ticSpacing))/2;
 rotate(-firstTic);
  for(var i=0;
 i<numTics;
 i++) 
{ moveTo(radius-ticLength,0);
 lineTo(radius+ticLength,0);
  rotate(-ticSpacing);
 }
 }
 }
 stroke();
 restore();
 }
  save();
 context.font=this.font;
 fillStyle=toStr(color);
 var measureRad=(this.measureRadius)? this.measureRadius : this.radius+12;
 var ang=toRadians(startAngle) + radians/2;
 var dispStr=manual? manual : degrees;
 if(showDegs) 
{ if (autoMoveEnabled && degrees<27) ang+=0.55;
 if(this.showDegs) b.placeLabel(context, dispStr+"\u00B0", ang, measureRad);
 }
 if(showLabel && pLabel && pLabel.length>0) 
{ b.placeLabel(context, pLabel, ang+pi, labelRadius);
 }
 restore();
 }
 }
 }
;
 this.getDegrees=function()  
{ var degs=this.getMeasure();
 this.degrees=roundtoN(degs , 0);
  return this.degrees;
 }
;
 this.getMeasure=function()   
{ with(this) 
{ var aAngle=toDegrees(b.theta(a));
 var cAngle=toDegrees(b.theta(c));
 var degs;
  if(aAngle<cAngle) 
{firstAngle=aAngle;
 secondAngle=cAngle;
}
  else 
{firstAngle=cAngle;
 secondAngle=aAngle;
}
   if (secondAngle-firstAngle < 180) 
{ startAngle=firstAngle;
 degs=secondAngle-firstAngle;
  }
 else 
{ startAngle=secondAngle;
 degs=firstAngle+(360-secondAngle);
  }
 return degs;
 }
  }
;
 this.measure=function()  
{ with(this) 
{ var angA=b.theta(a);
 var angC=b.theta(c);
 var extent=angC - angA;
 if(extent<0) extent +=twoPi;
 return extent;
 }
 }
;
 this.setMeasure=function(m)    
{ with(this) 
{ if (m==null) manual=null;
 else manual=roundtoN(m , 0);
  }
 }
;
 }
 
function AngleTrig (origin,  pPt )  
{ this.type="Angletrig";
 this.origin=origin;
 this.p=pPt;
 this.x=0;
 this.y=0;
 this.ang=origin.theta(this.p);
 this.prevQuadrant=1;
  this.revs=0;
  this.dir=POS;
  this.spiralRadius=20;
  this.spiralPitch=1;
  this.radians=false;
  this.measureFont="11px sans-serif";
  this.posColor="#000000";
 this.negColor="#ff0000";
 this.arcThickness=1;
 this.showArc=true;
 this.showMeasure=true;
 this.showArrowhead=true;
 this.radianMark=true;
 this.visible=true;
 var measureText;
 var textFmt;
 var arc;
 this.reset=function() 
{ this.revs=0;
 this.dir=POS;
 }
;
 this.update=function() 
{ with(this) 
{  ang=origin.theta(p);
 var thisQuadrant=quadrantOf(ang);
  if (thisQuadrant==1 && prevQuadrant==4)  
{ if (dir==POS) 
{ revs++;
 }
 else  
{ if (revs==0) dir=POS;
 else revs--;
 }
 }
 else if (thisQuadrant==4 && prevQuadrant==1)  
{ if (dir==POS) 
{ if (revs==0) dir=NEG;
 else revs--;
 }
 else  
{ revs++;
 }
 }
 }
 }
;
 this.reInit=function() 
{ this.revs=0;
 this.dir=POS;
 this.prevQuadrant=1;
 }
;
 this.paint=function() 
{ if(!this.visible) return;
 with(this) 
{ drawSpiral();
 drawMeasure();
 prevQuadrant=quadrantOf(origin.theta(p));
 }
 }
;
 this.drawSpiral=function() 
{ if(this.showArc) with(this) 
{ var delta=.1;
  var rad=spiralRadius;
 var totalSpiralAngle;
 if (dir==POS) 
{ totalSpiralAngle=revs*twoPi + ang;
 with (context) 
{ lineWidth=arcThickness;
 strokeStyle=posColor;
 beginPath();
 moveTo(origin.x+spiralRadius, origin.y);
 for (var i=0;
 i<=totalSpiralAngle;
 i+=delta) 
{ lineTo(origin.x + rad*Math.cos(i), origin.y - (rad)*Math.sin(i));
 rad=spiralRadius+(i*spiralPitch);
  }
  if(this.showArrowhead) 
{ drawArrowHead(rad,dir);
 }
 stroke();
 }
 }
 else  
{ totalSpiralAngle=-(revs*twoPi) -(twoPi-ang);
 with (context) 
{ lineWidth=arcThickness;
 strokeStyle=negColor;
 beginPath();
 moveTo(origin.x+spiralRadius, origin.y);
 for (var i=0;
 i>totalSpiralAngle;
 i-=delta) 
{ lineTo(origin.x + rad*Math.cos(i), origin.y - (rad)*Math.sin(i));
 rad=spiralRadius-(i*spiralPitch);
 }
  if(this.showArrowhead) 
{ drawArrowHead(rad,dir);
 }
 stroke();
 }
 }
 }
 }
;
 this.drawArrowHead=function(rad, dir) 
{ with(this) 
{ var tipX=origin.x+rad*Math.cos(origin.theta(p));
 var tipY=origin.y-rad*Math.sin(origin.theta(p));
 if(Math.abs(actualAngle()) > .3)  with (context) 
{ lineTo(tipX, tipY);
 save();
 translate(tipX, tipY);
 rotate(-ang);
 lineTo(3, dir==POS? 6 : -6);
 moveTo(0,0);
 lineTo(-5,dir==POS? 6 : -6);
 restore();
 }
 }
 }
;
 this.drawMeasure=function() 
{ if(this.showMeasure) with(this) 
{  var degStr;
 if(dir==POS) 
{ if(radians) degStr=asString(revs*twoPi+ang, 2) + ( radianMark? " r" : "");
 else degStr=Math.round(revs*360 + toDegrees(ang)) + "\u00B0";
 }
 else 
{ if(radians) degStr="-"+ asString(revs*twoPi+twoPi-ang, 2) + ( radianMark? " r" : "");
 else degStr="-"+ Math.round(revs*360 + toDegrees(twoPi-ang)) + "\u00B0";
 }
 with(context) 
{ fillStyle=(dir==POS)? posColor : negColor;
 font=measureFont;
 var lx=origin.x + spiralRadius + revs*11+5;
 var ly=(dir==POS)? origin.y-12 : origin.y+15;
 fillText(degStr, lx, ly);
 }
 }
  }
;
 this.indicatedAngle=function()  
{ with(this) 
{ if(dir==POS) 
{ if(radians) return roundtoN(revs*twoPi+ang, 2);
 else return Math.round(revs*360 + toDegrees(ang));
 }
 else  
{ if(radians) return -roundtoN(revs*twoPi+twoPi-ang, 2);
 else return -Math.round(revs*360 + toDegrees(twoPi-ang));
 }
 }
 }
;
 this.actualAngle=function()  
{ with(this) 
{ if(dir==POS) 
{ return revs*twoPi+ang;
 }
 else  
{ return -(revs*twoPi+twoPi-ang);
 }
 }
 }
;
 }
 
function AngleWhole( aPt, bPt, cPt, labl, tcs) 
{ this.type="AngleWhole";
  this.ptA=aPt;
 this.ptB=bPt;
 this.ptC=cPt;
 this.pLabel=labl || "";
 this.numTics=(!tcs)? 0 : tcs;
 this.showArc=true;
  this.showLabel=true;
  this.showDegs=true;
  this.showTics=true;
  this.showMeasure=true;
  this.font="bold 11px sans-serif";
  this.color=stdLineColor;
  this.manual=null;
  this.ticSpacing=0.3;
  this.ticLength=3;
  this.clockwise=false ;
  this.degrees;
  this.arcThickness=1;
  this.radius=12;
  this.measureRadius=this.radius + 12;
  this.labelRadius=12;
  this.rtAngEnabled=true;
  this.autoMoveEnabled=true;
  this.visible=true;
 this.update=function() 
{}
;
 this.paint=function() 
{ if(!this.ptA) return;
  if(!this.visible) return;
  this.degrees=this.getDegrees();
 var measure=this.ptB.theta(this.ptC) - this.ptB.theta(this.ptA);
 if(measure<0) measure +=twoPi;
 var sweep=this.clockwise? twoPi-measure : measure;
 var measAngle=this.ptB.theta(this.ptA) +(this.clockwise? -sweep/2 : sweep/2);
 with(this) with(context) 
{ save();
 lineWidth=arcThickness;
 strokeStyle=toStr(color);
 translate(ptB.x, ptB.y);
 rotate(-ptB.theta(ptA));
 beginPath();
 if((degrees==90 || manual==90) && showArc && rtAngEnabled)  
{ if(showArc) 
{ var cnr=radius/1.3;
 moveTo(cnr,0);
 lineTo(cnr, clockwise? cnr : -cnr);
 lineTo(0, clockwise? cnr : -cnr);
 }
 }
 else 
{ if(showArc) 
{ arc(0 ,0, radius, 0, -measure, !clockwise);
 if( numTics>0 && showTics && showMeasure && (numTics*ticSpacing)<sweep)  
{ var firstTic=(sweep-((numTics-1)*ticSpacing))/2;
 rotate(clockwise? firstTic : -firstTic);
  for(var i=0;
 i<numTics;
 i++) 
{ moveTo(radius-ticLength,0);
 lineTo(radius+ticLength,0);
  rotate(clockwise? ticSpacing : -ticSpacing);
 }
 }
 }
 }
 stroke();
 restore();
  fillStyle=toStr(this.color);
 font=this.font;
  if(showMeasure && degrees !=90 && manual !=90) 
{ var ang=(autoMoveEnabled && degrees<27)? measAngle+0.55 : measAngle;
 ptB.placeLabel(context, degrees+"\u00B0", ang, measureRadius);
 }
  if(showLabel && pLabel && pLabel.length>0) ptB.placeLabel(context, pLabel, (measAngle+pi)%(twoPi), labelRadius);
 }
  }
;
 this.getDegrees=function()  
{ return Math.round( this.getMeasure() );
 }
;
 this.getMeasure=function()  
{ var angA=toDegrees(this.ptB.theta(this.ptA));
 var angC=toDegrees(this.ptB.theta(this.ptC));
 if(this.clockwise) return (angA>=angC)? angA-angC : 360-(angC - angA);
 else return (angC>=angA)? angC-angA : 360-(angA - angC);
 }
;
 this.setMeasure=function(m)  
{ this.manual=m }
;
 this.setFontsize=function(s) 
{ this.font="bold "+s+"px sans-serif";
 }
;
 }

function Arrow(ax, ay, bx, by, aEnd, bEnd, bold, color, aShort, bShort) 
{ this.type="Arrow";
  this.ax=ax? ax : 0;
  this.ay=ay? ay : 0;
  this.bx=bx? bx : 80;
  this.by=by? by : 80;
  this.aEnd=!!aEnd;
  this.bEnd=(bEnd==undefined)? true : bEnd;
  this.bold=!!bold;
  this.color=color || 0x888888;
 this.aShort=aShort? aShort : 0;
  this.bShort=bShort? bShort : 0;
  this.visible=true;
 this.update=function() 
{}
;
 this.paint=function() 
{ if(!this.visible) return;
 with(this) 
{ var arx=7;
 var ary=2;
  var a=new GeomPoint(ax, ay);
 var b=new GeomPoint(bx, by);
 var len=a.distance(b);
 var ang=a.theta(b);
 if (len-aShort-bShort < arx) return;
  var leftEnd=aShort;
 var rightEnd=len-bShort;
 with (context) 
{ save();
 translate(a.x, a.y);
 rotate(-ang);
 lineWidth=bold? 2 : 1;
 strokeStyle=toStr(color);
 beginPath();
  moveTo(leftEnd,0);
 lineTo(rightEnd ,0);
 if(aEnd)  
{ moveTo(leftEnd,0);
  lineTo(leftEnd+arx, ary);
 moveTo(leftEnd,0);
 lineTo(leftEnd+arx, -ary);
 }
 if(bEnd)  
{ moveTo(rightEnd,0);
  lineTo(rightEnd-arx, ary);
 moveTo(rightEnd,0);
 lineTo(rightEnd-arx, -ary);
 }
 stroke();
 restore();
 }
  }
  }
 ;
  }

function Button(x,y,label,callback) 
{ this.type="Button";
 this.x=x;
 this.y=y;
 this.width=80;
 this.height=22;
 this.borderColor=false;
 this.backgroundColor=false;
 this.label=label;
 this.textColor=false;
 this.fontSize=13;
  this.callback=callback;
 this.buttn=false;
  this.update=function() 
{ if (!this.buttn)  
{ this.buttn=document.createElement('input');
 this.buttn.setAttribute('type', 'button');
 this.buttn.onmousedown=this.callback;
 this.buttn.ontouchstart=this.callback;
 var bod=document.getElementsByTagName('body')[0];
 bod.appendChild(this.buttn);
 }
 this.buttn.value=this.label;
 with (this.buttn.style) 
{ position="absolute";
 left=this.x*bScale +"px";
 top=this.y*bScale +"PX";
 height=this.height*bScale +"px";
 width=this.width*bScale +"px";
 if(this.borderColor) border=bScale+"px solid "+toStr(this.borderColor);
 if(this.backgroundColor) background=toStr(this.backgroundColor);
 if(this.textColor) color=toStr(this.textColor);
 fontSize=this.fontSize*bScale +"px";
 verticalAlign="middle";
 cursor="pointer";
 margin=0;
 }
 }
;
 this.reset=function() 
{}
;
 this.paint=function() 
{ this.update();
  }
;
 }
 
function Checkbox (xLoc, yLoc, label, sel, enable, callback) 
{ this.type="Checkbox";
 this.x=xLoc;
 this.y=yLoc;
 this.label=label;
 this.type="Checkbox";
 this.selected=sel;
 this.visible=true;
 this.callback=callback;
 this.labelColor="#456789";
 this.enabled=(enable==undefined)? true : enable;
 this.can;
 this.ctx;
 this.drawn=false;
   var bgCol="#ffffff";
 var boxW=12;
 var boxCol="#555555";
 var tickCol="#aa0000";
 var fnt="bold 12px arial";
 var m=3.3;
   this.can=document.createElement('canvas');
 with( this.can) 
{ with(style) 
{ position="absolute";
 cursor="pointer";
 visibility="hidden";
  }
 height=20 + (2*this.margin);
 }
  var bod=document.getElementsByTagName('body')[0];
 bod.appendChild(this.can);
 this.ctx=this.can.getContext('2d');
     ;
 this.draw= function() 
{ this.ctx.font=fnt;
 var textWidth=this.ctx.measureText(this.label).width;
 this.can.width=(textWidth + 2*(m) + 20 + 5) * bScale;
 this.can.height=(boxW + 2*(m)) * bScale;
  this.ctx.scale(bScale, bScale);
  this.can.style.left=(this.x*bScale)+"px";
 this.can.style.top=(this.y*bScale -m)+"px";
   with(this.ctx) 
{ fillStyle=bgCol;
 fillRect(m,m, boxW,boxW);
 strokeStyle=boxCol;
 lineWidth=1;
 strokeRect(m,m, boxW,boxW);
 }
  with(this.ctx) 
{ fillStyle=toStr(this.labelColor);
 font=fnt;
 fillText(this.label, m+boxW+4, boxW+2);
 }
 this.drawn=true;
 }
;
 this.update=function()   
{ this.drawn=false;
  }
;
 this.paint=function() 
{  this.can.style.visibility=(this.visible)? "visible" : "hidden";
 if(!this.visible) return;
   if(!this.drawn) this.draw();
  this.can.ownr=this;
  with(this.can) 
{ if (!onmousedown) 
{ onmousedown=this.click;
 ontouchstart=this.click;
 }
 }
 if(this.visible) with (this.ctx) 
{  fillStyle=bgCol;
 fillRect(4, 4, 11, 11);
 if(this.selected)  
{ strokeStyle=tickCol;
 lineWidth=2;
 beginPath();
 moveTo(5,9);
 lineTo(7,13);
 lineTo(13,5);
 stroke();
 }
 }
  }
;
  this.click=function(e) 
{ if (!e) var e=event;
 e.preventDefault();
 hideHints();
 with(e.currentTarget.ownr) 
{ if(enabled) selected=!selected;
  paint();
 if(callback) callback();
 }
 }
;
 this.setSelected=function(sel) 
{ this.selected=sel;
  }
;
 this.addEventListener=function(e, handler) 
{ this.callback=handler;
 }
;
 }
 
function ComboBox(callback, fontSize) 
{ this.type="ComboBox";
 this.callback=callback;
  this.x=0;
 this.y=0;
 this.width=80;
 this.height=20;
 this.fontSize=fontSize==undefined? 13 : fontSize;
 this.selectedIndex=0;
  this.selectedItem=1;
 this.itemList=[];
 this.select=false;
 this.visible=true;
 this.selectObj;
 this.update=function() 
{ if (!this.select)  
{ this.select=document.createElement('select');
 this.select.ownr=this;
 with(this.select.style) 
{ position="absolute";
 top=(this.y*bScale)+"px";
 left=(this.x*bScale)+"px";
 width=(this.width)*bScale+"px";
 height=(this.height)*bScale+"px";
 fontSize=this.fontSize*bScale+"px";
 }
 var bod=document.getElementsByTagName('body')[0];
 bod.appendChild(this.select);
  for (var i=0;
 i<this.itemList.length;
 i++) 
{ var option=document.createElement('option');
 this.select.options.add(option);
 option.text=this.itemList[i].label;
 option.value="99";
 }
  this.select.onchange=this.handler;
  this.selectedItem=this.itemList[0];
 this.selectedIndex=0;
 }
 this.select.selectedIndex=this.selectedIndex;
  this.selectedItem=this.itemList[this.selectedIndex];
 }
;
 this.selectOption=function(optionInx) 
{ this.update();
  this.select.options[optionInx].selected=true;
 this.selectedIndex=this.select.selectedIndex;
 }
;
 this.paint=function() 
{ this.update();
 this.select.style.visibility=(this.visible)? "visible" : "hidden";
 }
;
 this.addItem=function(item) 
{ this.itemList.push(item);
 }
;
 this.handler=function(e) 
{ if (!e) var e=event;
 e.preventDefault();
 with(e.currentTarget.ownr) 
{ selectedIndex=select.selectedIndex;
 selectedItem=itemList[this.selectedIndex];
 if(callback) callback();
 }
   }
;
 }

function Compass(callback) 
{ this.callback=callback;
 this.point=new GeomPoint(0,0);
  this.type="Compass";
 this.wid;
  this.angle;
  this.stdArcAngle=0.4;
  this.color=0xff00ff;
  this.visible=false;
 this.slope;
  this.ang=null;
  this.numSteps=Math.round(525/15);
  this.pxPerTick=null;
  this.approachDir=null;
 this.delay=null;
 this.extent=null;
 this.circleSteps=1250/15;
  this.paint=function() 
{ }
;
 this.reset=function()  
{ this.visible=false;
 this.drawCompass();
  lineCtx.clearRect(0,0,600,370);
 }
;
 this.set=function(loc, wid, anglePt)    
{ if(loc)  
{ this.point.x=loc.x;
 this.point.y=loc.y;
 }
 if(wid)  
{ this.wid=wid;
 }
   if(anglePt==undefined || anglePt==null) this.angle=0;
 else this.angle=this.point.theta(anglePt);
 }
;
 this.setColor=function(color, alpha) 
{  }
;
 this.resetStyle=function() 
{  }
;
 this.show=function(delay)    
{ this.delay=delay;
 window.compass=this;
  this.visible=true;
 this.drawCompass();
 if(this.exit(delay)) return;
 }
;
 this.hide=function(delay)    
{ this.delay=delay;
 this.visible=false;
 this.drawCompass();
 if(this.exit(delay)) return;
 }
;
 this.adjustRadius=function(p, delay)     
{ this.delay=delay;
 if(skin.fastFwd)  
{ this.wid=this.point.distance(p);
 this.callback();
 return;
 }
 else 
{ this.pxPerTick=(this.point.distance(p) - this.wid)/this.numSteps;
 startTimer(15,this.numSteps, this.adjRadius);
 }
 }
;
 this.adjRadius=function() 
{ var owner=window.compass;
 with(owner) 
{ wid +=pxPerTick;
  drawCompass();
 if(timer.numTicks==0) 
{ if(exit(delay)) return;
 }
 }
 }
;
 this.scribeArc=function(p, approachDir, delay, extent)      
{ this.approachDir=approachDir;
 this.delay=delay;
 this.extent=extent;
  this.arcExtent=(extent==undefined)? 0.4 : extent;
  with(this) 
{ var angleDelta=point.angleDiff(angle, point.theta(p), approachDir);
  if(approachDir==CW) angleDelta -=arcExtent/2;
 else angleDelta +=arcExtent/2;
 radiansPerTick=angleDelta/numSteps;
 if(approachDir==CW) radiansPerTick=-radiansPerTick;
 }
 if(skin.fastFwd)  with(this) 
{  var startAng=twoPi - ( point.theta(p)+(arcExtent/2) );
 var endAng=twoPi - ( point.theta(p)-(arcExtent/2) );
 lineCtx.strokeStyle="#555555";
 lineCtx.beginPath();
 lineCtx.arc(point.x, point.y, wid, startAng, endAng, false);
 lineCtx.stroke();
  this.angle=point.theta(p)-arcExtent/2;
 callback();
 return;
 }
 startTimer(15, this.numSteps, this.appch);
 }
;
 this.appch=function()  
{ var owner=window.compass;
 with(owner) 
{ angle +=radiansPerTick;
 drawCompass();
 if(timer.numTicks==0) 
{ lineCtx.strokeStyle="#888888";
 lineCtx.beginPath();
 radiansPerTick=arcExtent/numSteps;
 setTimeout(hes, 300);
  }
 }
 }
;
 this.hes=function() 
{ var owner=window.compass;
 startTimer(15, owner.numSteps, owner.doArc);
 }
;
 this.doArc=function()  
{ var owner=window.compass;
 with(owner) 
{ angle -=radiansPerTick;
 drawCompass();
 lineCtx.lineTo( point.x + wid*Math.cos(angle) ,point.y - wid*Math.sin(angle) );
 lineCtx.stroke();
 if(timer.numTicks==0) 
{ if(exit(delay)) return;
 }
 }
 }
;
 this.scribeCircle=function(delay)    
{ this.delay=delay;
 with(this) 
{ if(skin.fastFwd) 
{ with(lineCtx) 
{ beginPath();
 strokeStyle=toStr(color);
 arc(point.x, point.y, wid, 0, 2 * Math.PI, false);
 stroke();
 }
 this.callback();
 return;
 }
 radiansPerTick=2*Math.PI/circleSteps;
 lineCtx.strokeStyle=toStr(color);
 lineCtx.beginPath();
 startTimer(15, circleSteps+2, doCircle);
 }
 }
;
 this.doCircle=function() 
{ var owner=window.compass;
 with(owner) 
{ lineCtx.lineTo( point.x + wid*Math.cos(angle), point.y - wid*Math.sin(angle) );
 lineCtx.stroke();
 angle -=radiansPerTick;
 drawCompass();
 if(timer.numTicks==0) 
{ if(exit(delay)) return;
 }
 }
 }
;
 this.moveTo=function(target, delay)    
{ this.ang=this.point.theta(target);
 this.delay=delay;
 if(skin.fastFwd) 
{ this.point.x=target.x;
  this.point.y=target.y;
 this.callback();
 return;
 }
 this.pxPerTick=this.point.distance(target)/this.numSteps;
 this.slope=this.point.theta(target);
 startTimer(15, this.numSteps, this.adjustPos);
 }
;
 this.adjustPos=function() 
{ var owner=window.compass;
 with(owner) 
{ point.x=point.x + pxPerTick*Math.cos(ang);
 point.y=point.y - pxPerTick*Math.sin(ang);
 drawCompass();
 if(timer.numTicks==0) 
{ if(exit(delay)) return;
 }
 }
 }
;
 this.erase=function()  
{ lineCtx.clearRect(0, 0, 600, 370);
 }
;
 this.drawCompass=function()     
{  toolCtx.clearRect(0,0,appletWidth, appletHeight);
 with(toolCtx) if(this.visible) 
{ save();
 translate(this.point.x, this.point.y);
  rotate(-this.angle);
   var cx=this.wid/2.0;
  this.makeRect(cx-5, -45, 10, 15, "#345678", "#345678");
  this.makeRect(cx-2, -55, 4, 10, "#ffffff", "#333333");
  fillStyle="#d7d7d7";
 strokeStyle="#5A5A6E";
 beginPath();
 moveTo(cx-5, -41);
 lineTo(cx-5, -34);
 lineTo(0, -4);
 lineTo(0, -7);
 closePath();
 fill();
 stroke();
  beginPath();
 moveTo(cx+5, -41);
 lineTo(cx+5, -34);
 lineTo(this.wid, -4);
 lineTo(this.wid, -7);
 closePath();
 fill();
 stroke();
  this.makeRect(this.wid-2, -21, 4, 15, "#ffff00", "#666666");
  fillStyle="#464646";
 beginPath();
 moveTo(this.wid,0);
 lineTo(this.wid-2, -6);
 lineTo(this.wid+2, -6);
 fill();
  strokeStyle="#464646";
 moveTo(0, 0);
 lineTo(0, -8);
 stroke();
 restore();
 }
 }
;
  this.makeRect=function(x, y, wid, ht, fillCol, line)   
{ with (toolCtx) 
{ fillStyle=fillCol;
 beginPath();
 strokeStyle=line;
 rect(x, y, wid, ht);
 if(fill) fill();
 lineWidth=1;
 if(line) stroke();
 }
 }
;
 this.exit=function(delay)   
{ if(delay==0 || delay==undefined || delay==null) return true;
 with(this) if(skin.fastFwd) callback();
 else 
{ timeout=setTimeout(callback, delay);
 }
 }
;
 }

function CoordPlane(wid, ht, origin, margin, labelQuadrants) 
{ this.type="CoordPlane";
 this.wid=wid;
 this.ht=ht;
 this.orgSource=origin;
 this.margin=margin? margin : 20;
 this.labelQuadrants=!!labelQuadrants;
 this.color=0x668877;
 this.gridSize=28;
 this.unitsPerGrid=5;
  this.xUnitsPerGrid=null;
 this.yUnitsPerGrid=null;
 this.showGrid=true;
  this.showCoords=true;
  this.showPointers=true;
  this.showTics=true;
  this.showTicLabels=true;
  this.showAxisLabels=true;
  this.visible=true;
  this.gridZ=-100;
 this.cvs=null;
 this.ctx=null;
 this.midX=null;
 this.midY=null;
  this.m=null;
  this.lq=null;
  this.col=null;
  this.gs=null;
  this.upg=null;
  this.xupg=null;
  this.yupg=null;
  this.sg=null;
  this.st=null;
  this.stl=null;
   this.update=function() 
{ }
;
 this.paint=function() 
{  if(!this.cvs) this.makePlane();
  this.midX=Math.round(this.wid/this.gridSize)*this.gridSize;
 this.midY=Math.round(this.ht/this.gridSize)*this.gridSize;
 var nrd=this.needsRedraw();
 if(nrd) this.drawPlane();
 this.drawQuadrantLabels();
 this.cvs.style.visibility=(this.visible)? "visible" : "hidden";
   this.cvs.style.left=(this.orgSource.x - this.midX)*bScale +"px";
 this.cvs.style.top=(this.orgSource.y - this.midY)*bScale +"px";
 }
;
 this.needsRedraw=function()  
{ with (this) 
{ if( m==margin && lq==labelQuadrants && col==color && gs==gridSize && upg==unitsPerGrid && xupg==xUnitsPerGrid && yupg==yUnitsPerGrid && sg==showGrid && st==showTics && stl==showTicLabels) return false;
  }
 return true;
 }
;
 this.saveParams=function() 
{ with(this) 
{ m=margin;
 lq=labelQuadrants;
 col=color;
 gs=gridSize;
 upg=unitsPerGrid;
 xupg=xUnitsPerGrid;
 yupg=yUnitsPerGrid;
 sg=showGrid;
 st=showTics;
 stl=showTicLabels;
 }
 }
;
 this.makePlane=function()   
{ this.cvs=document.createElement('canvas');
 with(this.cvs) 
{ setAttribute("width", 2 * this.wid * bScale);
 setAttribute("height", 2 * this.ht * bScale);
 }
 with(this.cvs.style) 
{ position="absolute";
 top="0px";
 left="0px";
 pointerEvents="none";
 zIndex=this.gridZ+"";
 }
 var clipperDiv=document.getElementById('clipper');
 clipperDiv.appendChild(this.cvs);
  clipperDiv.style.width=(this.wid*bScale)+"px";
 clipperDiv.style.height=(this.ht*bScale)+"px";
  this.ctx=this.cvs.getContext('2d');
 if(bScale !=1) this.ctx.scale(bScale, bScale);
 }
;
 this.drawPlane=function()  
{ with(this.ctx) 
{ clearRect(0,0,this.wid*2, this.ht*2);
 if(this.showGrid) 
{ lineWidth=1;
 strokeStyle=toStr(this.color, 0.4);
 beginPath();
 for (var y=this.gridSize+0.5;
 y<this.ht*2;
 y+=this.gridSize)  
{ moveTo(0, y);
 lineTo(this.wid*2, y);
 }
 for (var x=this.gridSize+0.5;
 x<this.wid*2;
 x+=this.gridSize)  
{ moveTo(x, 0);
 lineTo(x, this.ht*2);
 }
 stroke();
 }
  lineWidth=2;
 strokeStyle=toStr(this.color);
 fillStyle= toStr(this.color);
 font="bold  11px arial";
 beginPath();
 moveTo(0, this.midY);
 lineTo(this.wid*2, this.midY);
  moveTo(this.midX, 0);
 lineTo(this.midX, this.ht*2);
   if(this.showTics) 
{ for (var y=this.gridSize+0.5;
 y<this.ht*2;
 y+=this.gridSize) this.yTic(y);
  for (var x=this.gridSize+0.5;
 x<this.wid*2;
 x+=this.gridSize) this.xTic(x);
  }
 stroke();
 }
 this.saveParams();
 }
;
 this.yTic=function(y)  
{ var yUnits=this.yUnitsPerGrid? this.yUnitsPerGrid : this.unitsPerGrid;
 var ticNum=Math.round((this.midY-y)/this.gridSize);
  var label=Math.round(ticNum*yUnits);
 if(label !=0) with(this) with(ctx) 
{ if(showTicLabels) 
{ fillText(label, midX+8, y+3);
 }
 moveTo(midX, y);
 lineTo(midX+5, y);
 }
 }
;
 this.xTic=function(x)  
{ var xUnits=this.xUnitsPerGrid? this.xUnitsPerGrid : this.unitsPerGrid;
 var ticNum=Math.round((this.midX-x)/this.gridSize);
  var label=-Math.round(ticNum*xUnits);
 if(label !=0) with(this) 
{ if(showTicLabels) ctx.fillText(label, x-(label<0? 8:5), midY-8);
 ctx.moveTo(x, midY);
 ctx.lineTo(x, midY-5);
 }
 }
;
 this.drawQuadrantLabels=function()   
{ var top=20;
 var bot=this.ht -40;
 var left=20;
 var right=this.wid-100;
 with(this) if(labelQuadrants) with(context) 
{ fillStyle="#888888";
 font="italic bold 16px  sans-serif";
 if (orgSource.x<this.wid-100 && orgSource.y>30) fillText("Quadrant 1", right,top);
 if (orgSource.x>100 && orgSource.y>30) fillText("Quadrant 2", left,top);
 if (orgSource.x>100 && orgSource.y<this.ht-55) fillText("Quadrant 3", left,bot);
 if (orgSource.x<this.wid-100 && orgSource.y<this.ht-55) fillText("Quadrant 4", right,bot);
 }
 }
;
  this.getCoords=function(p)  
{ var result=new Point();
 with(this) 
{ result.x=(p.x-orgSource.x)*unitsPerGrid/gridSize;
 result.y=(orgSource.y-p.y)/gridSize*unitsPerGrid;
 }
 return result;
 }
;
 this.stageLocn=function(p)  
{ var res=new GeomPoint();
 res.x=getX(p.x);
 res.y=getY(p.y);
 return res;
 }
;
 this.getLocation=function(px, py)  
{ return new Point(this.getX(px) , this.getY(py) );
 }
;
 this.getX=function(px)  
{ return this.orgSource.x + px*this.gridSize/this.unitsPerGrid;
 }
;
 this.getY=function(py)  
{ return this.orgSource.y - py*this.gridSize/this.unitsPerGrid;
 }
;
 this.constrain=function(p)  
{ if(p.x < margin) p.x=margin;
 if(p.x > wid-margin) p.x=wid-margin;
 if (p.y < margin) p.y=margin;
 if(p.y > ht-margin) p.y=ht-margin;
 }
;
 this.getQuadrant=function(p)  
{ if (p.y <=this.orgSource.y && p.x >=this.orgSource.x ) return 1;
 if (p.y <=this.orgSource.y && p.x < this.orgSource.x ) return 2;
 if (p.y > this.orgSource.y && p.x <=this.orgSource.x ) return 3;
 return 4;
 }
;
 this.getScaleFactor=function()  
{ return this.gridSize/this.unitsPerGrid;
 }
;
 }

function Cursor()  
{ this.type="Cursor";
 this.x=60;
 this.y=50;
 this.enabled=true;
  this.visible=false;
  this.lastTap=0;
  this.candidateList;
 this.mouse= 
{ x : 0, y : 0, dragging: false, xOffset : 0, yOffset : 0, captureRadius: 7 }
;
 this.touch= 
{ x : 0, y : 0, xOffset : 0, yOffset : 0, captureRadius: 12, attached : false, dragging : false,  rightSide : false,  nearTop : false  }
;
 var arrow= [ [0,0], [0,14], [3,12], [6,19], [9.5,17.5], [6.5,11], [10,10], [0,0] ];
 this.touchDown=function(e)  
{ if (!e) var e=event;
 e.preventDefault();
 var touchObj=e.touches[0];
 hideHints();
  var clock=new Date();
 var now=clock.getTime();
 if(now - csr.lastTap < 250)  
{ cmdFull();
  return;
 }
 csr.lastTap=now;
  if(!csr.enabled) return;
  with(csr.touch) 
{ x=touchObj.pageX/bScale;
 y=touchObj.pageY/bScale;
  csr.candidateList=[];
 for(var i=0;
 i<pointList.length;
 i++) 
{ var p=pointList[i];
 if(p.draggable && p.visible) csr.candidateList.push(p);
 }
  if(csr.candidateList.length==1) 
{ p=csr.candidateList[0];
 xOffset=p.x - x;
  yOffset=p.y - y;
 pointBeingMoved=p;
 attached=true;
 }
 else 
{  rightSide=(x > appletWidth/2);
 nearTop=(y < 75);
 var xOff=(nearTop)? 100 : 75;
 xOffset=rightSide? -xOff : xOff;
  yOffset= nearTop? 0 : -75;
  attached=false;
 }
 dragging=true;
  csr.x=x + xOffset;
 csr.y=y + yOffset;
 csr.visible=true;
 }
  update();
 }
;
 this.touchMove=function(e)  
{ if (!e) var e=event;
 e.preventDefault();
 with(csr.touch) 
{ if(!dragging) return;
 x=e.targetTouches[0].pageX/bScale;
 y=e.targetTouches[0].pageY/bScale;
  csr.x=x + xOffset;
 csr.y=y + yOffset;
  if (csr.x>appletWidth-3) csr.x=appletWidth-3;
  if (csr.y>appletHeight-2) csr.y=appletHeight-2;
  if (csr.x<0) csr.x=0;
  if (csr.y<2) csr.y=2;
  update();
 if(attached) 
{ if(csr.candidateList.length==1)  
{ csr.visible=false;
 }
 pointBeingMoved.x=csr.x;
 pointBeingMoved.y=csr.y;
 pointMoved();
  }
 else  
{  pointBeingMoved=nearPoint(csr.touch);
 if(pointBeingMoved) 
{ attached=true;
 }
 }
 }
  }
;
 this.unTouch=function(e)  
{ csr.visible=false;
 csr.touch.attached=false;
 update();
 }
;
  this.mouseDown=function(e)  
{ if (!e) var e=event;
 hideHints();
 with(csr.mouse) 
{ x= e.pageX/bScale;
 y= e.pageY/bScale;
 pointBeingMoved=nearPoint(csr.mouse);
 if(pointBeingMoved) 
{ dragging=true;
 }
 }
 }
;
 this.mouseMove=function(e)  
{ if (!e) var e=event;
 with(csr.mouse) 
{ x= e.pageX/bScale;
 y= e.pageY/bScale;
 if(dragging)  
{ pointBeingMoved.x=x + xOffset;
 pointBeingMoved.y=y + xOffset;
 pointMoved();
  }
 else  
{ if(nearPoint(csr.mouse)) 
{ canvas.style.cursor="pointer";
 }
 else 
{ canvas.style.cursor="default" ;
}
 }
 }
  }
;
 this.mouseUp=function(e)  
{ with(csr.mouse) 
{ dragging=false;
 canvas.style.cursor="default";
 }
 }
;
 this.update=function() 
{}
;
 this.paint=function()  
{ if (this.visible) with(context)  
{ beginPath();
 strokeStyle="#000000";
 fillStyle="#ffffff";
 lineWidth=0.8;
 for(var i=0;
 i<arrow.length;
 i++) 
{ var pt=arrow[i];
 if(csr.touch.rightSide) lineTo( this.x+pt[0] , this.y+pt[1] );
 else lineTo( this.x-pt[0] , this.y+pt[1] );
 }
 fill();
 stroke();
 }
 }
;
 this.reset=function() 
{ this.visible=false;
 csr.touch.attached=false;
  }
;
   canvas.addEventListener("mousedown", this.mouseDown, false);
 document.body.addEventListener("mousemove", this.mouseMove, false);
 document.body.addEventListener("mouseup", this.mouseUp, false);
      canvas.addEventListener("touchstart", this.touchDown, false);
 document.body.addEventListener("touchmove", this.touchMove, false);
 document.body.addEventListener("touchend", this.unTouch, false);
 document.body.addEventListener("touchcancel", this.unTouch, false);
 }
 function nearPoint(device)    
{  var closePtDist=1000000;
 var closePt;
 for(var i=0;
 i<pointList.length;
 i++) 
{ var p=pointList[i];
 var cursorLoc=
{ x: device.x + device.xOffset , y: device.y + device.yOffset }
;
 if(p.draggable && p.visible) 
{ var dist=p.distance(cursorLoc);
 if(dist < closePtDist) 
{ closePtDist=dist;
 closePt=p;
 }
 }
 }
  if(closePtDist < device.captureRadius) return closePt;
 else return false;
 }

function Ellipse(c,  xRadius,  yRadius,  gridAnchor,  gridSize)  
{ this.type="Ellipse";
 this.c=c;
 this.xRadius=xRadius==undefined? 50 : xRadius;
 this.yRadius=yRadius==null? xRadius : yRadius;
  this.lineColor=stdLineColor;
 this.gridAnchor=gridAnchor;
 this.gridSize=gridSize==undefined? 30 : gridSize;
 this.gridColor=stdGridColor;
 this.lineWidth=1;
 this.fillColor=stdFillColor;
  this.step=0.1;
 this.visible=true;
 this.rt=appletWidth;
 this.bot=appletHeight;
 this.update=function() 
{}
;
 this.paint=function() 
{ if(!this.visible) return;
 with(this) 
{ with (context) 
{ save();
 lineWidth=this.lineWidth;
 strokeStyle=toStr(lineColor);
 fillStyle=toStr(fillColor);
 beginPath();
 for (var i=0;
 i < twoPi+step;
 i +=step ) 
{ lineTo(c.x+(xRadius * Math.cos(i)) , c.y-(yRadius * Math.sin(i)));
 }
 closePath();
 if(fillColor !=null) fill();
 stroke();
    if(gridAnchor) 
{ clip();
  beginPath();
 strokeStyle=toStr(gridColor);
 for(var i=gridAnchor.y;
 i<bot;
 i+=gridSize)  
{ moveTo(0, i);
 lineTo(rt,i);
}
 for(i=gridAnchor.y;
 i>0;
 i-=gridSize)  
{ moveTo(0, i);
 lineTo(rt,i);
}
 for(i=gridAnchor.x;
 i<rt;
 i+=gridSize)  
{ moveTo(i, 0);
 lineTo(i, bot);
}
 for(i=gridAnchor.x;
 i>0;
 i-=gridSize)  
{ moveTo(i, 0);
 lineTo(i, bot);
}
 stroke();
 restore();
  }
 restore();
 }
  }
  }
;
  }
 
function GeomLine(a, b, tics, extA, extB, posn) 
{ this.type="GeomLine";
 this.a=a;
 this.b=b;
 this.numTics=tics? tics : 0;
  this.extA=extA? extA : 0;
  this.extB=extB? extB : 0;
  this.posn=posn;
   this.lineColor=stdLineColor;
 this.lineWidth=1;
 this.ticSize=3;
 this.ticSpacing=4;
 this.visible=true;
 this.update=function() 
{}
;
 this.paint=function() 
{ if(!this.visible) return;
 with(this) with(context) 
{ save();
 var ang=a.theta(b);
 var len=a.distance(b);
 translate(a.x, a.y);
 rotate(-ang);
  lineWidth=this.lineWidth;
 strokeStyle=toStr(this.lineColor);
 beginPath();
 if(!posn)  
{ moveTo(0-this.extA, 0);
  lineTo(len+this.extB, 0);
 }
  var ticGroupWidth=((this.numTics-1) * this.ticSpacing) + 1;
 var ticX, firstTic;
 if(ticGroupWidth < len-10)  
{  if (posn) firstTic=len*posn/100;
  else firstTic=(len - ticGroupWidth)/2;
   for (var t=0 ;
 t < this.numTics ;
 t++) 
{ ticX=firstTic + (t * this.ticSpacing);
 moveTo(ticX, this.ticSize);
 lineTo(ticX, -this.ticSize);
 }
 }
 stroke();
  restore();
 }
 }
;
 this.setP2=function(r, theta)   
{ this.b.x=this.a.x + r * Math.cos(theta);
 this.b.y=this.a.y - r * Math.sin(theta);
 }
;
 }
 function Ticmarks(a, b, tics, posn) 
{ var numTics=tics || 1;
 var percent=posn || 50;
  return new GeomLine(a, b, numTics, 0, 0, posn);
 }

function Graphics(ctx) 
{ this.type="Graphics";
 this.ctx=ctx;
 this.list=[];
  this.persist=false;
 this.gradient;
   this.beginFill=function(col, alpha) 
{ var obj= 
{ f : function() 
{ctx.fillStyle=this.styl;
 ctx.beginPath();
}
, styl: toStr(col, alpha) }
;
 this.list.push(obj);
 }
;
 this.clear=function(persist)  
{ this.list=[];
  this.persist=!!persist;
  }
;
 this.clip=function() 
{ var obj= 
{ f: function() 
{ctx.clip();
 }
, }
;
 this.list.push(obj);
 }
;
 this.save=function() 
{ var obj= 
{ f: function() 
{ctx.save();
 }
, }
;
 this.list.push(obj);
 }
;
 this.restore=function() 
{ var obj= 
{ f: function() 
{ctx.restore();
 }
, }
;
 this.list.push(obj);
 }
;
 this.endFill=function() 
{ var obj= 
{ f: function() 
{ctx.fill();
 }
, }
;
 this.list.push(obj);
 }
;
 this.lineStyle=function(thickness, col, alpha) 
{ var obj= 
{ f: function() 
{ ctx.lineWidth=this.th;
 ctx.strokeStyle=this.str;
 }
, str: toStr(col,alpha), th: thickness }
;
 this.list.push(obj);
 }
;
 this.lineTo=function(x,y,noStroke) 
{ var obj= 
{ f: function() 
{ctx.lineTo(this.x, this.y);
 if(this.stroke) ctx.stroke();
 }
, x: x, y: y, stroke: !noStroke  }
;
 this.list.push(obj);
 }
;
 this.moveTo=function(x,y) 
{ var obj= 
{ f: function() 
{ctx.beginPath();
 ctx.moveTo(this.x, this.y);
 }
, x: x, y: y }
;
 this.list.push(obj);
 }
;
 this.drawArc=function(g, nX, nY, nRadius, nStartingAngle, nArc)     
{ var obj= 
{ f: function() 
{ ctx.beginPath();
 ctx.arc(this.x, this.y, this.rad, -this.start, -(this.start+this.ext), true);
 ctx.stroke();
 }
, x : nX,  y : nY,  rad : nRadius,  start: toRadians(nStartingAngle),  ext : toRadians(nArc )  }
;
 this.list.push(obj);
 }
;
 this.arcTo=function(g, nX, nY, nRadius, nStartingAngle, nArc, direction)   
{ var obj= 
{ f: function() 
{ ctx.arc(this.x, this.y, this.rad, -this.start, -(this.start+this.ext), this.dir);
 }
, x : nX,  y : nY,  rad : nRadius,  start: toRadians(nStartingAngle),  ext : toRadians(nArc),  dir : (direction==undefined)? true : direction  }
;
 this.list.push(obj);
 }
;
 this.drawCircle=function(nX, nY, nRadius, noStroke) 
{ var obj= 
{ f : function() 
{ctx.beginPath();
 ctx.arc(this.x, this.y, this.rad,0, 2*Math.PI,false);
 if(!this.defer) ctx.stroke();
 }
, x : nX,  y : nY, rad : Math.abs(nRadius),  defer : !!noStroke }
;
 this.list.push(obj);
 }
;
 this.drawRect=function(nX ,nY, wid, ht) 
{ var obj= 
{ f : function() 
{ctx.beginPath();
 ctx.moveTo(this.x, this.y);
 ctx.lineTo(this.x+this.w, this.y);
 ctx.lineTo(this.x+this.w, this.y+ht);
 ctx.lineTo(this.x , this.y+ht);
 ctx.closePath();
 ctx.stroke();
 }
, x : nX, y : nY, w : wid, h : ht }
;
 this.list.push(obj);
 }
;
 this.drawEllipse=function(nX, nY, wid, ht) 
{ var obj= 
{ f : function() 
{ var yr=this.ht/2;
 var xr=this.wid/2;
 var cpx=this.x + xr;
 var cpy=this.y + yr;
 ctx.beginPath();
 for (var ang=0;
 ang<=twoPi+0.1;
 ang +=0.1) 
{ var xa=cpx + xr*Math.cos(ang);
 var ya=cpy - yr*Math.sin(ang);
 ctx.lineTo(xa,ya);
 }
 ctx.stroke();
 }
, x : nX,  y : nY,  wid : wid,  ht : ht  }
;
 this.list.push(obj);
 }
;
 this.closePath=function() 
{ var obj= 
{ f: function() 
{ctx.closePath();
 ctx.stroke();
}
 }
;
 this.list.push(obj);
 }
;
 this.createLinearGradient=function(ax, ay, bx, by) 
{ var obj= 
{ f : function() 
{ gradient=ctx.createLinearGradient(this.px,this.py, this.qx,this.qy);
 }
, px : ax,  py : ay,  qx : bx,  qy : by  }
;
 this.list.push(obj);
 }
;
 this.createRadialGradient=function(ax, ay, r1, r2) 
{ var obj= 
{ f : function() 
{ gradient=ctx.createRadialGradient(this.px, this.py, this.ra, this.px, this.py, this.rb);
 }
, px : ax,  py : ay,  ra : r1,  rb : r2  }
;
 this.list.push(obj);
 }
;
 this.addColorStop=function(loc, color) 
{ var obj= 
{ f : function() 
{ gradient.addColorStop(this.lc, toStr(this.col));
 }
, lc : loc,  col : color  }
;
 this.list.push(obj);
 }
;
 this.beginGradientFill=function() 
{ var obj= 
{ f: function() 
{ctx.fillStyle=gradient;
 }
 }
;
 this.list.push(obj);
 }
;
 this.stroke=function() 
{ var obj= 
{ f: function() 
{ctx.stroke();
 }
 }
;
 this.list.push(obj);
 }
;
 this.translate=function(x,y) 
{ var obj= 
{ f: function() 
{ctx.translate(this.x, this.y);
 }
, x: x, y: y }
;
 this.list.push(obj);
 }
;
 this.render=function(x,y,rotation) 
{ ctx.save();
 if(x!=undefined && y!=undefined) ctx.translate(x,y);
 if(rotation!=undefined && rotation !=0) ctx.rotate(toRadians(rotation));
 for (var i=0;
 i<this.list.length;
 i++) 
{ var obj=this.list[i];
 obj.f();
 }
 ctx.restore();
 if(!this.persist) 
{ this.list=[];
  }
 }
;
 }

function Hint( pt, pos, txt) 
{ this.type="Hint";
  this.p=pt;
 this.position=pos;
 this.text=txt;
 this.color=stdHintColor;
 this.offset=5;
 this.lineLen=50;
 this.gap=3;
 this.arrow=new Arrow(0, 0, 0, 0, true, false);
 this.arrow.visible=false;
 this.lab=new TextObj(0, 0, "", this.color, true, false, 12);
 this.lab.visible=false;
 this.update=function() 
{}
;
 this.paint=function() 
{ if(!this.visible) return;
 with(this) 
{ var pOffset=offset/Math.sqrt(2);
 var pEnd=(lineLen+offset)/Math.sqrt(2);
 lab.text=text;
 lab.visible=true;
 arrow.color=color;
 arrow.visible=true;
 switch (position) 
{ case 1:  arrow.ax=p.x;
 arrow.ay=p.y-offset;
 arrow.bx=arrow.ax;
 arrow.by=arrow.ay-lineLen;
 lab.x=arrow.bx-lab.getWidth()/2;
 lab.y=arrow.by-gap-lab.size;
 break;
 case 2:  arrow.ax=p.x;
 arrow.ay=p.y+offset;
 arrow.bx=arrow.ax;
 arrow.by=arrow.ay+lineLen;
 lab.x=arrow.bx-lab.getWidth()/2;
 lab.y=arrow.by+gap;
 break;
 case 3:  arrow.ax=p.x-offset;
 arrow.ay=p.y;
 arrow.bx=arrow.ax-lineLen-offset;
 arrow.by=arrow.ay;
 lab.x=arrow.bx-lab.getWidth()-gap;
 lab.y=arrow.by-lab.size/2 -2 ;
 break;
 case 4:  arrow.ax=p.x+offset;
 arrow.ay=p.y;
 arrow.bx=arrow.ax+lineLen+offset;
 arrow.by=arrow.ay;
 lab.x=arrow.bx + gap;
 lab.y=arrow.by-lab.size/2 -2;
 break;
 case 5:  arrow.ax=p.x + pOffset;
 arrow.ay=p.y - pOffset;
 arrow.bx=arrow.ax + pEnd;
 arrow.by=arrow.ay - pEnd;
 lab.x=arrow.bx + gap;
 lab.y=arrow.by -14;
 break;
 case 6:  arrow.ax=p.x - pOffset;
 arrow.ay=p.y - pOffset;
 arrow.bx=arrow.ax - pEnd;
 arrow.by=arrow.ay - pEnd;
 lab.x=arrow.bx-lab.getWidth()-gap;
 lab.y=arrow.by -14;
 break;
 case 7:  arrow.ax=p.x + pOffset;
 arrow.ay=p.y + pOffset;
 arrow.bx=arrow.ax + pEnd;
 arrow.by=arrow.ay + pEnd;
 lab.x=arrow.bx+gap;
 lab.y=arrow.by-6;
 break;
 case 8:  arrow.ax=p.x - pOffset;
 arrow.ay=p.y + pOffset;
 arrow.bx=arrow.ax - pEnd;
 arrow.by=arrow.ay + pEnd;
 lab.x=arrow.bx-lab.getWidth()-gap;
 lab.y=arrow.by-6;
 break;
 }
  lab.paint();
 arrow.paint();
 }
  }
;
 }
 Hint.prototype.visible=false;
 Hint.show=function() 
{ this.prototype.visible=true;
 stopTicking();
 update();
 }
;
 Hint.hide=function() 
{if(this.prototype.visible) 
{ this.prototype.visible=false;
 update();
 }
 }
;
   Hint.ABOVE=1;
 Hint.BELOW=2;
 Hint.LEFT=3;
 Hint.RIGHT=4;
 Hint.ABOVERT=5;
 Hint.ABOVELFT=6;
 Hint.BELOWRT=7;
 Hint.BELOWLFT=8;

 var showingDetails=true;
 var hidingDetails=true;
 var appletDiv;
     var draggedObject=false;
 var isIpad=navigator.platform.indexOf("iPad") >=0;
  var VISIBLE=true;
 var csrMode=0;
  var INVISIBLE=false;
 var DRAGGABLE=true;
 var NON_DRAGGABLE=false;
 var POS=1;
 var NEG=2;
  var times="\u00D7";
 var minus="\u2212";
 var stdLineColor=0x0000FF;
  var stdFillColor=0xFFFFAA;
  var stdGridColor=0xbbccbb;
  var stdHintColor=0xdd5000;
  var BLACK=0x000000;
  var twoPi=Math.PI*2;
 var pi=Math.PI;
 var ninety=Math.PI/2;
 var oneEighty=Math.PI;
 var twoSeventy=3*Math.PI/2;
 var root3=Math.sqrt(3);
 var csr=false;
  var pointList=new Array();
 var displayList=new Array();
 var pointBeingMoved;
  var numChildren=0;
 var bScale=1;
  var resetCmd, runCmd, fullCmd, saveCmd, showCmd, hideCmd, printCmd;
 var appletWidth=getParam("wid");
 var appletHeight=getParam("ht");
  var canvas=document.createElement('canvas');
 with(canvas) 
{ setAttribute("width", appletWidth);
 setAttribute("height", appletHeight);
 setAttribute("class", "canvClass");
 setAttribute("id", "canvId");
 }
  canvas.style.zIndex=1;
   var context=canvas.getContext('2d');
  var graphics=new Graphics(context);
 function getParam(name)   
{ var paramPart=location.search.substr(1);
  var params=paramPart.split("&");
 for(var i=0;
 i<params.length;
 i++) 
{ var dup=params[i].split("=");
 if(dup[0]==name) return dup[1];
 }
 return false;
 }
;
  var Event=
{ENTER_FRAME: 1, id: 0, elapsed:0}
;
 function startTicking(e, callback) 
{ switch(e) 
{ case 1: Event.callback=callback;
 Event.id=setInterval(tick, 1000/30);
 break;
  case "orientationchange": break;
 default: alert("unknown event:  "+e);
 }
 }
;
 function removeEventListener(e, callback) 
{ clearInterval(Event.id);
 }
;
 function stopTicking() 
{ clearInterval(Event.id);
 }
;
 function timeElapsed(waitMillisec) 
{ var msecPerTick=1000/30;
 Event.elapsed +=msecPerTick;
 if (Event.elapsed >=waitMillisec) 
{ Event.elapsed=0;
  return true;
  }
 else return false;
  }
;
 function tick(callback)     
{ if (typeof animation !="undefined" && animation.substr(0,4).toLowerCase()=="stop") 
{ clearInterval(Event.id);
 }
 else 
{ Event.callback();
 }
 }
;
  function startApplet() 
{ var bod=document.getElementsByTagName('body')[0];
 bod.appendChild(canvas);
 csr=new Cursor();
   runCmd=new LinkCmd("Run", 0, 0, cmdRun) ;
 resetCmd=new LinkCmd("Reset", 0, 0, cmdReset);
 fullCmd=new LinkCmd("Full screen", 0, 0, cmdFull);
 saveCmd=new LinkCmd("Save as link", 0, 0, cmdSave);
 showCmd=new LinkCmd("Hide details", 0, 0, cmdShow);
 hideCmd=new LinkCmd("Show details", 0, 0, cmdHide);
 printCmd=new LinkCmd("Print", 0, 0, cmdPrint);
  if(window.name !="iframe") 
{ window.addEventListener("orientationchange", turned, false);
  setScale();
 if(fullCmd) fullCmd.legend="Close";
  }
 if(this.hasOwnProperty("build")) build();
 }
;
 function startConstApplet()  
{ var bod=document.getElementsByTagName('body')[0];
 bod.appendChild(canvas);
  if(window.name !="iframe") 
{ window.addEventListener("orientationchange", turned, false);
  setScale();
 sizeBtn.value="Close";
   buttonBar.style.top=370*bScale + "px";
 buttonGroup.style.left=((300*bScale)-300) + "px";
 }
 build();
  }
;
 function turned()  
{ if(window.name !="iframe") 
{ setScale();
 repaint();
 }
 }
;
 function setScale() 
{ var headerHt=100;
  var usableWid=screen.width;
 var usableHt=screen.height;
 if(isIpad)  
{ if( window.orientation && (window.orientation==90 || window.orientation==-90) )  
{ var temp=usableWid;
 usableWid=usableHt;
 usableHt=temp;
 }
 }
 usableHt -=headerHt;
 var xScale=usableWid/appletWidth;
 var yScale=usableHt/appletHeight;
 bScale=Math.min(xScale, yScale);
  canvas.width=appletWidth*bScale;
 canvas.height=appletHeight*bScale;
 context.setTransform(1,0,0,1,0,0);
  context.scale(bScale,bScale);
 }
 function repaint() 
{  context.clearRect(0, 0, appletWidth, appletHeight);
    graphics.render();
  for(var i=0 ;
 i<displayList.length ;
 i++) 
{  displayList[i].paint();
 }
 showMe();
  if(csr) csr.paint();
  }
;
 function hideHints() 
{ Hint.hide();
 }
;
  function toRadians(degs) 
{ return Math.PI*degs/180;
 }
;
 function toDegrees(rads) 
{ return rads*180/Math.PI;
 }
;
 function roundtoN(d, n)    
{ var multiplier;
 switch(n) 
{ case 0: return Math.round(d);
 case 1: multiplier=10;
 break;
 case 2: multiplier=100;
 break;
 case 3: multiplier=1000;
 break;
 case 4: multiplier=10000;
 break;
 default: return Number.NaN;
 }
 return Math.round(d*multiplier) / multiplier;
 }
;
 function asString(dval, n, plusSignP, trailZerosP)      
{ if(isNaN(dval)) return Number.NaN;
 var minus="\u2212";
 var plusSign=(plusSignP==undefined)? false : plusSignP;
 var trailZeros=(trailZerosP==undefined)? true : trailZerosP;
 var n=(n==undefined)? 0 : n;
  if(dval==Number.POSITIVE_INFINITY) return ""+dval;
 if(dval==Number.NEGATIVE_INFINITY) return ""+dval;
 var isNegative=(dval<0);
 var num;
 if(isNegative) num=dval * -1;
  else num=dval;
  var res="" + roundtoN(num, n);
 if(isNaN(res)) return Number.NaN;
  if(trailZeros) 
{ var numPlaces=0;
 if (res.indexOf(".") >=0) numPlaces=res.length - res.indexOf(".") - 1;
  if(numPlaces==0 && n>0) res+=".";
 for(var i=numPlaces;
 i<n;
 i++) res+="0";
 }
    if(isNegative) res=minus + res;
  if(plusSign && dval>0) res="+" + res;
 return res;
 }
;
 function inRange ( p, a, b)   
{ var low=Math.min(a,b);
 var hi=Math.max(a,b);
 return (p>=low && p<=hi);
 }
;
 function movePoint(p)  
{ pointBeingMoved=p;
 pointMoved(null);
  pointBeingMoved=null;
 }
;
 function trace(obj) 
{ var s="";
 for(var i=0;
 i<arguments.length;
 i++) 
{ s+=arguments[i]+" &nbsp;
&nbsp;
    ";
 }
 window.parent.document.getElementById('dbg').innerHTML +="<br>"+s;
 }
;
 function show(obj) 
{ var s="";
 for(var i=0;
 i<arguments.length;
 i++) 
{ s+=arguments[i]+" &nbsp;
&nbsp;
    ";
 }
 window.parent.document.getElementById('dbg').innerHTML="show: "+s;
 }
;
 var runCmd, resetCmd, fullCmd, saveCmd, showCmd, hideCmd, printCmd;
 function addCommands(cmdList)  
{ var cmd;
 var gap=appletWidth / (cmdList.length+1);
 for(var i=1;
 i<=cmdList.length;
 i++)  
{ cmd=cmdList[i-1];
 cmd.setLocation(appletWidth -(i*gap) , appletHeight-20);
 addChild(cmd);
 }
 }
;
 function cmdRun(e) 
{ e.preventDefault();
 if (runCmd.legend=="Run") 
{ runCmd.setLegend("Stop");
 animStart();
  }
 else 
{ runCmd.setLegend("Run");
 animStop();
  }
 }
;
 function cmdReset(e) 
{ showCmd.legend="Hide details";
  showingDetails=true;
 for(var i=0;
 i<pointList.length;
 i++)  
{ pointList[i].reset();
 }
 reset();
  }
;
 function cmdFull(e) 
{ if (typeof altCmdFull=='function')  
{ altCmdFull(fullCmd);
 return;
 }
 if(fullCmd.legend=="Close")  
{ window.close();
 }
 else 
{ fullScreen();
 }
 }
;
 function cmdSave(e) 
{ saveAsLink();
  }
;
 function cmdShow(e) 
{ if(showCmd.legend=="Hide details") 
{ showCmd.legend="Show Details";
}
 else showCmd.legend="Hide details";
 showingDetails=(showCmd.legend==="Hide details");
   var elems=parent.document.getElementsByClassName("hideDetails");
 for(var i=0;
 i<elems.length;
 i++) elems[i].style.visibility= showingDetails? "visible" : "hidden";
 update();
  }
;
 function cmdHide(e) 
{ if(hideCmd.legend=="Show details") 
{ hideCmd.legend="Hide Details";
}
 else hideCmd.legend="Show details";
 hidingDetails=(hideCmd.legend==="Show details");
 update();
  }
;
 function cmdPrint(e) 
{ focus();
  print();
 }
;
 function fullScreen(auxParams) 
{    var viewerPage=parent.iFrameSrcFile;
   if(location.href.indexOf("src")>0) viewerPage +="debug";
  viewerPage +=".html?applet="+appletName+"&wid="+appletWidth+"&ht="+appletHeight;
 if(auxParams !=undefined) 
{ viewerPage +="&";
 viewerPage +=auxParams;
 }
 var windowOptions="toolbar=no,,left=0,top=0,screenX=0,screenY=0,height="+screen.availHeight+",width="+screen.availWidth;
 var win=open(viewerPage , '_blank', windowOptions);
  }
;
 function resetPoints() 
{ for(var i=0;
 i<pointList.length;
 i++)  
{ pointList[i].reset();
 }
 }
;
 function makeMask(x,y,wid,ht) 
{ var mask= 
{ type: "Mask", x : x, y : y, wid : wid, ht : ht }
;
 return mask;
 }
;
 function addChild(obj) 
{  if (obj.type=="Mask") return;
 displayList.push(obj);
 numChildren++;
  obj.parentSprite=this;
  if(obj.hasOwnProperty("isPoint")) pointList.push(obj);
 }
;
 function getChildAt(i) 
{ return displayList[i];
 }
;
 function removeChild(obj) 
{ for(var i=0;
 i<displayList.length;
 i++) 
{ if(displayList[i]==obj)  
{ displayList.splice(i,1);
  return;
 }
 }
 }
;
 function toStr(color, alpha) 
{  var str=(typeof color=="number")? '#' + ('00000' + (color | 0).toString(16)).substr(-6) : color;
 if(alpha !=undefined)  
{ var rgba="RGBA(";
 rgba +=parseInt(str.substr(1,2),16) + ",";
 rgba +=parseInt(str.substr(3,2),16) + ",";
 rgba +=parseInt(str.substr(5,2),16) + ",";
 rgba +=alpha + ")";
 return rgba;
 }
 return str;
 }
;
 function quadrantOf(angle)  
{ var ang=angle % (Math.PI*2);
  if(angle>=0 && angle<ninety ) return 1;
 else if(angle>=ninety && angle<oneEighty ) return 2;
 else if(angle>=oneEighty && angle<twoSeventy ) return 3;
 else return 4;
 }
;
 function Point(x,y) 
{ this.x=x;
 this.y=y;
 this.add=function(p) 
{ var res=new Point(this.x+p.x, this.y+p.y);
 return res;
 }
 }
;
 function snapToMultiple(val, pitch, range)   
{ var res=val;
 var remainder=val % pitch;
 if (remainder < range)  
{ res=val/pitch;
  res=Math.floor(res);
  res=res*pitch;
  }
 if(remainder > (pitch-range) )  
{ res=(val+range)/pitch;
  res=Math.floor(res);
  res=res *pitch;
  }
 return res;
 }
;
 function clearDisplayList(obj)  
{ obj.clearDisplayList();
 }
;
 function quadratic(a,b,c)  
{ var j=(-b + Math.sqrt(b*b-4*a*c))/(2*a);
 var k=(-b - Math.sqrt(b*b-4*a*c))/(2*a);
 return [j,k];
 }
;
 function absAngleDiff(p,q)   
{ var g=Math.abs(p-q);
 if(g>Math.PI) g=twoPi-g;
 return g;
 }
;
 function cot(x) 
{return Math.cos(x) / Math.sin(x) }
;
 function csc(x) 
{return 1 / Math.sin(x) }
;
 function sec(x) 
{return 1 / Math.cos(x) }
;
 var timer= 
{ numTicks : 0, tickCallback : null, clock : null }
;
 function startTimer(speed, numTicks, tickCallback) 
{ timer.numTicks=Math.round(numTicks);
 timer.tickCallback=tickCallback;
 timer.clock=setInterval(doTick, speed);
 }
;
 function doTick() 
{ with(timer) 
{ numTicks --;
 if(numTicks==0) 
{ clearInterval(clock);
 }
 tickCallback();
 }
 }
;
 function addSign(s)   
{ var c1=s.charAt(0);
 if(c1=='+' || c1=='-' || c1=='\u2212') return s;
 return "+" + s;
 }
   function updateAllPoints() 
{ update();
 }
 var _showMe="";
  function showMe(v) 
{ if(v!=undefined) _showMe=v;
 if(_showMe.length>0) context.fillText(_showMe, 20,20);
 }

  var pnum=0;
  function LabeledPoint(xLoc, yLoc, visible, draggable, label, angle, plane, id) 
{ this.type="Point";
 this.isPoint=true;
  this.x=xLoc;
 this.initX=xLoc;
 this.y=yLoc;
 this.initY=yLoc;
 this.initVisible=this.visible=!!visible;
 this.initDraggable=this.draggable=!!draggable;
 this.initLabel=this.label=label || "";
 this.initLabelAngle=this.labelAngle=(angle==undefined)? 135 : angle;
  this.plane=plane;
 this.dragColor="#ff4040";
 this.dragAlpha=0.4;
  this.nonDragColor="#404040";
 this.nonDragAlpha=1.0;
  this.radius=3;
  this.nondragRadius=2;
  this.showPoint=true;
  this.showLabel=true;
 this.size=12;
 this.labelColor=stdLineColor;
 this.labelRadius=6;
 this.savedX=this.x;
 this.savedY=this.y;
  this.letter=null;
 this.showCoords=true;
 this.labelQuadrant=null;
  this.showPointers=false;
  this.pointerColor="#ff6600";
  this.a1=null;
 this.a2=null;
    if (plane) 
{ if(id)  this.letter=id;
 else 
{ this.letter=String.fromCharCode(pnum+65);
 pnum=(pnum+1) % 26;
 }
 }
;
  this.update=function() 
{}
;
 this.reset=function()   
{ with(this) 
{ x=initX;
 y=initY;
 visible=initVisible;
 draggable=initDraggable;
 label=initLabel;
 labelAngle=initLabelAngle;
 if(draggable) setPrevious();
 }
 }
;
 this.paint=function() 
{ if(!this.visible) return;
   if(this.plane && !this.a1) with(this) 
{ a1=new Arrow(0, 0, 0, 0, false, true, false, 0, 6,2);
 a2=new Arrow(0, 0, 0, 0, false, true, false, 0, 6,2);
 a1.visible=a2.visible=false;
 parentSprite.addChild(a1);
  parentSprite.addChild(a2);
 }
 with(context) 
{ save();
 if(this.showPoint) 
{ if(this.draggable) 
{ this.setPrevious();
 beginPath();
 fillStyle=toStr(this.dragColor, this.dragAlpha);
 arc(this.x, this.y, this.radius, 0 ,Math.PI*2, true);
  fill();
 }
 else  
{ beginPath();
 fillStyle=toStr(this.nonDragColor, this.nonDragAlpha);
 arc(this.x, this.y, this.nondragRadius, 0 ,Math.PI*2, true);
  fill();
 }
 }
   if(this.plane) 
{ this.coordLabel();
 this.coordArrows();
 }
 else 
{ this.pointLabel();
 }
;
 restore();
 }
  }
;
 this.toString=function() 
{ return(this.x+"   "+this.y);
 }
;
 this.pointLabel=function()  
{ if(this.showLabel && this.label.length>0) with(context) 
{ fillStyle=toStr(this.labelColor,1);
 font="normal normal bold  "+this.size+"px sans-serif";
 var halfHeight=5;
 var halfWidth=measureText(this.label).width/2;
 var vRadius=this.labelRadius + halfHeight;
 var hRadius=this.labelRadius + halfWidth;
 var labelX=this.x + (hRadius * Math.cos(toRadians(this.labelAngle))) - halfWidth;
 var labelY=this.y - (vRadius * Math.sin(toRadians(this.labelAngle)))+ halfHeight;
 fillText(this.label, labelX, labelY);
 }
 }
;
 this.coordLabel=function()  
{ if(this.showLabel) with(context) 
{ var text;
 if(this.plane.showCoords && this.showCoords) 
{text=this.getLabelString();
 }
 else text=this.letter;
  var quadrant;
 if (this.labelQuadrant)  quadrant=this.labelQuadrant;
 else  quadrant=this.plane.getQuadrant(this);
   var dy=(quadrant<3)? -10 : 16;
 var dx=(quadrant==2 || quadrant==3)? -20 : 2;
  fillStyle=toStr(this.labelColor,0.7);
 font="normal normal bold  "+this.size+"px sans-serif";
 fillText(text, this.x+dx, this.y+dy);
 }
 }
;
 this.coordArrows=function()  
{ var relOrigin;
 with(this) 
{ a1.visible=a2.visible=(showPointers || plane.showPointers);
 if(a1.visible) 
{ with(a1)  
{ ax=x;
 ay=y;
 bx=origin.x;
 by=y;
 color=pointerColor;
 }
 with(a2)  
{ ax=x;
 ay=y;
 bx=x;
 by=origin.y;
 color=pointerColor;
 }
 }
 }
  }
;
 this.setInitProperties=function()  
{ this.initX=this.x;
 this.initY=this.y;
 this.initVisible=this.visible;
 this.initDraggable=this.draggable;
 }
;
  this.set=function(newxy) 
{ this.x=newxy.x;
 this.y=newxy.y;
 }
;
 this.setLocation=function(xloc, yloc, setAsInit) 
{ this.x=xloc;
 this.y=yloc;
 if(this.draggable) 
{ this.prevX=xloc;
 this.prevY=yloc;
 }
 if(setAsInit) 
{ this.initX=this.x;
 this.initY=this.y;
 }
 }
;
 this.setPrevious=function() 
{ this.prevX=this.x;
 this.prevY=this.y;
 }
;
 this.setDragColor=function(col, alph) 
{ this.dragColor=col;
 this.nonDragAlpha=alph;
 }
;
 this.distance=function(p)  
{ var dx=this.x - p.x;
 var dy=this.y - p.y;
 return Math.sqrt(dx*dx + dy*dy);
 }
;
 this.angleDiff=function(a, b, dir)      
{ if(Math.abs(a-b) < 0.001) return 0;
 if(dir==2) 
{ if (a >=b) return (2*Math.PI) + b - a;
 else return b-a;
 }
 else  
{ if(a>=b) return a-b;
 else return (2*Math.PI) + a - b;
 }
 }
;
 this.theta=function(b)  
{ var ang=Math.atan2( this.y - b.y , b.x - this.x);
 if(ang<0) return (ang + twoPi);
 return ang;
 }
;
 this.thetaPt=function(px, py)  
{ var ang=Math.atan2( this.y - py , px - this.x);
 if(ang<0) return (ang + twoPi);
 return ang;
 }
;
 this.bisector=function(p, q, reflex)   
{ var pAng=this.theta(p);
 var qAng=this.theta(q);
 var res;
 if (pAng < qAng) 
{ if (qAng-pAng <Math.PI) res=pAng+(qAng-pAng)/2.0;
 else res=(qAng + (pAng+twoPi-qAng)/2.0) % twoPi;
 }
 else 
{ if (pAng-qAng <Math.PI) res=qAng+(pAng-qAng)/2.0;
 else res=(pAng + (qAng+twoPi-pAng)/2.0) % twoPi;
 }
 if(reflex) res=(res+pi) % twoPi;
 return(res);
 }
;
 this.midPoint=function(p, q)  
{ this.x=Math.min(p.x, q.x) + Math.abs((p.x-q.x)/2.0);
 this.y=Math.min(p.y, q.y) + Math.abs((p.y-q.y)/2.0);
 }
;
 this.perpendicular=function(origin, a, b, len)   
{ var ang=a.theta(b);
 var perpAng=ang+Math.PI/2;
 this.x=origin.x + len * Math.cos(perpAng);
 this.y=origin.y - len * Math.sin(perpAng);
 }
;
 this.slope=function(p)   
{ if (this.x==p.x) return Number.NaN;
   var leftPt, rightPt;
 if(this.x < p.x) 
{leftPt=this;
 rightPt=p;
}
 else 
{leftPt=p;
 rightPt=this;
}
  var dx=Math.abs( (p.x - this.x) );
 var dy=Math.abs( (this.y - p.y) );
 if(rightPt.y > leftPt.y) dy=dy * -1;
   return dy / dx;
  }
;
 this.intercept=function(slope)   
{ return this.y + slope * this.x;
 }
;
 this.intersection=function(a,b, p,q)     
{ var abM, pqM, abB, pqB;
  if (a.verticalWith(b) && p.verticalWith(q)) 
{ this.x=a.x;
 this.y=Number.INFINITY;
 return false;
 }
  if (a.horizontalWith(b) && p.horizontalWith(q)) 
{ this.x=Number.INFINITY;
 this.y=b.y;
 return false;
 }
  var abM=(b.y - a.y) / (b.x - a.x);
 var pqM=(q.y - p.y) / (q.x - p.x);
 var abB=a.y - abM * a.x;
 var pqB=p.y - pqM * p.x;
 if (a.verticalWith(b))  
{ this.x=a.x;
 this.y=pqM*this.x + pqB;
 return true;
 }
 if (p.verticalWith(q))  
{ this.x=p.x;
 this.y=abM*this.x + abB;
 return true;
 }
  var intX=(pqB-abB) / (abM-pqM);
 this.x=intX;
 this.y=abM*intX + abB;
 return true;
 }
;
 this.horizontalWith=function(p)   
{ return (Math.round(this.y)==Math.round(p.y));
 }
;
 this.verticalWith=function(p)   
{ return (Math.round(this.x)==Math.round(p.x));
 }
;
 this.intersects=function( b, p,q )  
{ var k=new LabeledPoint(0,0, false, false);
 k.intersection(this, b , p,q);
 var result= ( inRange(k.x, this.x, b.x) && inRange(k.y, this.y, b.y) && inRange(k.x, p.x, q.x) && inRange(k.y, p.y, q.y) );
 return result;
 }
;
 this.samePlace=function(p)    
{ var res=( Math.round(this.x)==Math.round(p.x) && Math.round(this.y)==Math.round(p.y) );
 return res;
 }
;
 this.produce=function( a,b, len)   
{ var slope=a.theta(b);
 this.x=b.x + len*Math.cos(slope);
 this.y=b.y - len*Math.sin(slope);
 }
;
 this.perpIntersection=function(a,b, p)    
{ if(a.x==b.x)  
{ this.x=a.x;
 this.y=p.y;
 }
 else if (a.y==b.y)  
{ this.x=p.x;
 this.y=a.y;
 }
 else  
{ var abSlope=a.slope(b);
 var abIntercept=a.intercept(abSlope);
 var pSlope=-1/abSlope;
  var pIntercept=p.intercept(pSlope);
 this.x=(abIntercept-pIntercept) /(abSlope-pSlope);
 this.y= abIntercept - abSlope*this.x;
 }
 }
;
 this.inSegment=function(a, b)  
{ if(a.verticalWith(b)) return inRange(this.x, a.x,b.x) ;
 else if(a.horizontalWith(b)) return inRange(this.y, a.y,b.y) ;
 else return inRange(this.x, a.x,b.x) && inRange(this.y, a.y,b.y);
 }
;
 this.save=function()  
{ this.savedX=this.x;
 this.savedY=this.y;
 }
;
 this.restore=function()     
{ this.x=this.savedX;
 this.y=this.savedY;
 }
;
 this.asPoint=function()  
{ return 
{x:this.x, y:this.y}
;
 }
;
 this.setFromPolar=function(p)  
{ this.x=p.origin.x + p.r * Math.cos(p.theta);
 this.y=p.origin.y - p.r * Math.sin(p.theta);
 }
;
 this.toPolar=function(center)  
{ var xOffset=this.x - center.x;
 var yOffset=center.y - this.y;
 var res= 
{ r : Math.sqrt((xOffset * xOffset) + (yOffset * yOffset)),  theta : Math.atan2(yOffset, xOffset), origin : center.copy(), rotate: function(angle)  
{ this.theta +=angle;
 return this;
 }
 }
;
 return res;
 }
;
 this.copy=function() 
{ return new LabeledPoint(this.x, this.y, this.visible, this.draggable);
 }
;
 this.setFrom=function(p)  
{ this.x=p.x;
 this.y=p.y;
 }
;
 this.tangentPoint=function( p, center, radius, which)    
{ var pDist=p.distance(center);
 if (pDist<radius) 
{ this.x=this.y=-1;
 return;
 }
 var r=Math.asin(radius/pDist);
 var s;
 var q=p.theta(center);
 if(which>0) 
{ s=(piOver2-r)-q;
 this.x=center.x - radius*Math.cos(s);
 this.y=center.y - radius*Math.sin(s);
 }
 else 
{ s=q-r;
 this.x=center.x + radius*Math.sin(s);
 this.y=center.y + radius*Math.cos(s);
 }
 }
;
 this.placeLabel=function(ctx, lab, ang, r)   
{ with(ctx) 
{ var halfWid=measureText(lab).width/2;
 var mx=this.x + r*Math.cos(ang) - halfWid;
 var my=this.y - r*Math.sin(ang) + 5 ;
 fillText(lab, mx, my);
 }
 }
;
    this.setLocInGridUnits=function(gx, gy)  
{ with(this) 
{ var scale=plane.getScaleFactor();
 x=plane.orgSource.x + gx*scale;
 y=plane.orgSource.y - gy*scale;
 }
 }
;
 this.setYInGridUnits=function(gy)   
{ if(gy !=null) y=plane.orgSource.y - gy*plane.getScaleFactor();
 }
;
 this.setXInGridUnits=function(gx)   
{ var scale=plane.getScaleFactor();
 if(gx !=null) this.x=plane.orgSource.x + gx*plane.getScaleFactor();
 }
;
 this.getLocInGridUnits=function()    
{ var scale=plane.getScaleFactor();
 var gx=(this.x - plane.orgSource.x)/scale;
 var gy=(plane.orgSource.y - this.y)/scale;
 return new Point(gx,gy);
 }
;
 this.getXInGridUnits=function()    
{ return (this.x - plane.orgSource.x)/plane.getScaleFactor();
 }
;
 this.getYInGridUnits=function()    
{ return (plane.orgSource.y - this.y)/plane.getScaleFactor();
 }
;
 this.getXCoordAsDisplayed=function()   
{ var coords=plane.getCoords(this);
  return Math.round(coords.x);
 }
;
 this.getYCoordAsDisplayed=function()   
{ var coords=plane.getCoords(this);
  return Math.round(coords.y);
 }
;
 this.distanceAsDisplayed=function(p)    
{ var dx=this.getXCoordAsDisplayed() - p.getXCoordAsDisplayed();
 var dy=this.getYCoordAsDisplayed() - p.getYCoordAsDisplayed();
 var dist=Math.sqrt(dx*dx + dy*dy);
 return dist;
 }
;
 this.snapToWholeNumber=function() 
{ var tmp=getLocInGridUnits();
 tmp.x=Math.round(tmp.x);
 tmp.y=Math.round(tmp.y);
 setLocInGridUnits(tmp.x, tmp.y);
 }
;
 this.getLabelString=function()  
{ var coords=plane.getCoords(this);
  coords.x=Math.round(coords.x);
 coords.y=Math.round(coords.y);
 var str=this.letter + " (" + coords.x + "," + coords.y + ")";
 return str;
 }
;
 }
;
    function GeomPoint(xLoc, yLoc, visible, draggable) 
{ var xP=(xLoc==undefined)? 50 : xLoc;
 var yP=(yLoc==undefined)? 50 : yLoc;
 var visibleP=(visible==undefined)? false : visible;
 var draggableP=(draggable==undefined)? false : draggable;
 return new LabeledPoint(xP, yP, visibleP, draggableP);
 }
;
  function CoordPoint (xloc, yloc, cPlane, id) 
{ var cp= new LabeledPoint(xloc, yloc, true, true, "", 0, cPlane, id);
 return cp;
 }
;

  function Length( p1p, p2p, posn, prep, postp) 
{ this.type="Length";
  this.p1=p1p;
 this.p2=p2p;
 this.pos=posn==undefined? 1 : posn;
  this.pre=prep || "";
 this.post=postp || "";
 this.showLen=true;
  this.color=0x234567;
 this.scale=10.0;
 this.offset=8;
 this.auto=true;
 this.places=1;
 this.size=11;
 this.manualDist;
 this.visible=true;
 this.update=function() 
{}
;
 this.paint=function() 
{ if(!this.visible) return;
  var left, right, upper, lower;
 if (this.p1.x < this.p2.x) 
{left=this.p1;
 right=this.p2;
}
 else 
{left=this.p2;
 right=this.p1;
 }
 if (this.p1.y > this.p2.y) 
{lower=this.p1;
 upper=this.p2;
}
 else 
{lower=this.p2;
 upper=this.p1;
 }
 with(context) 
{ save();
 textAlign="center";
 font="bold "+this.size+"px sans-serif";
 fillStyle=toStr(this.color);
 if(this.p1.x==this. p2.x)  
{ translate(lower.x, lower.y);
 rotate(-Math.PI/2);
 fillText( this.length(), lower.distance(upper)/2, this.pos==Length.ABOVE? -6 : +14);
 }
 else  
{ translate(left.x, left.y);
 rotate(-left.theta(right));
 fillText( this.length(), left.distance(right)/2, this.pos==Length.ABOVE? -6 : +14);
 }
 restore();
 }
 }
;
 this.length=function() 
{  var lenStr=(this.showLen)? this.len() : "";
 var s= "" + this.pre + lenStr + this.post;
 return s;
 }
;
 this.len=function()  
{ var res;
 if(this.auto) 
{ res= roundtoN(this.p1.distance(this.p2) / this.scale , this.places);
 }
 else 
{ if(typeof manualDist=="number") res= roundtoN(manualDist ,places);
 else res=this. manualDist;
  }
 return res;
 }
;
 this.setManualDist=function(dist)  
{ this.auto=false;
 this.manualDist=dist;
 }
;
 this.setAuto=function()  
{ this.auto=true;
 }
;
 }
 Length.ABOVE=1;
 Length.BELOW=2;
  function Linelabel( p1, p2, posn, label) 
{ var len=new Length(p1, p2, posn);
 len.setManualDist(label);
 return len;
 }
 Linelabel.ABOVE=1;
 Linelabel.BELOW=2;

function LinkCmd (legend, xLoc, yLoc, handler ,noBg) 
{ this.type="LinkCmd";
 this.legend=legend;
 this.x=xLoc? xLoc : 50;
 this.y=yLoc? yLoc : 50;
 this.handler=handler;
 this.visible=true;
 this.input=false;
  this.color="#456789";
  this.border="none";
  this.background="transparent";
  this.width=100;
  this.update=function() 
{ if (!this.input)  
{ this.input=document.createElement('input');
 this.input.type="button";
 this.input.ownr=this;
  with(this.input.style) 
{ position="absolute";
 top=((this.y-5)*bScale)+"px";
 left=((this.x-this.width/2)*bScale)+"px";
  width=(this.width)*bScale + "px";
 height=25*bScale + "px";
 cursor="pointer";
 border=this.border;
 background=this.background;
 textDecoration="underline";
 fontWeight="bold";
 fontSize=(11*bScale) + "px";
 color=this.color;
 }
 var bod=document.getElementsByTagName('body')[0];
 bod.appendChild(this.input);
 this.input.onmousedown=linkCmdTouch;
 this.input.ontouchstart=linkCmdTouch;
 }
 }
;
 function linkCmdTouch(e) 
{ if (!e) var e=event;
 e.preventDefault();
 this.ownr.handler(e);
 }
 this.paint=function() 
{ this.update();
  this.input.style.visibility=(this.visible)? "visible" : "hidden";
 this.input.value=this.legend;
 }
;
 this.setLegend=function(legend) 
{ this.legend=legend;
 if(this.input) this.input.value=legend;
 }
;
 this.setLocation=function(xLoc, yLoc) 
{ this.x=xLoc;
 this.y=yLoc;
 if(this.input) with(this.input.style) 
{ top=(this.y*bScale)+"px";
 left=((this.x-50)*bScale)+"px";
  }
 }
;
 }
 
function ParallelMarks(aPt, bPt, num, posn) 
{ this.type="ParallelMarks";
  this.a=aPt;
 this.b=bPt;
 this.num=num? num : 1;
  this.position=posn? posn : 50;
  this.color=stdLineColor;
 this.arrowSpacing=5;
 this.arrowLength=4;
 this.firstArrowLoc=null;
  this.visible=true;
 this.update=function() 
{}
;
 this.paint=function() 
{ if(!this.visible) return;
 with(this) 
{  var len=a.distance(b);
 var arrowX;
 var firstArrow=firstArrowLoc;
 if (firstArrow==null)  
{ firstArrow=len*this.position/100;
  }
 if(len < (num+1)*arrowSpacing) return;
   with(context) 
{ save();
 translate(a.x, a.y);
 rotate( -a.theta(b) );
  lineWidth=1;
 strokeStyle=toStr(color);
 beginPath();
 for (var t=0;
 t < num;
 t++) 
{ arrowX=firstArrow + (t * arrowSpacing);
 moveTo(arrowX - arrowLength, -arrowLength+1);
 lineTo(arrowX, 0);
 lineTo(arrowX - arrowLength, arrowLength-1);
 }
 stroke();
  restore();
 }
 }
  }
;
  }
;
 
function Poly(pointsList,  gridAnchr,  gridSize,  lablList)  
{ this.type="Poly";
  this.points=pointsList;
 this.gridAnchor=gridAnchr;
 this.gridSize=gridSize? gridSize : 20;
 this.labels=lablList;
 this.lineColor=stdLineColor;
 this.fillColor=stdFillColor;
 this.fillAlpha=1.0;
 this.gridColor=stdGridColor;
 this.gridAnchor;
  this.showLabels=true;
  this.labelColor=stdLineColor;
 this.labelRadius=12;
 this.labelFont="bold 11px sans-serif";
  this.visible=true;
 this.rt=appletWidth;
 this.bot=appletHeight;
 this.update=function() 
{}
;
 this.paint=function() 
{ if(!this.visible) return;
 with(this) with(context) 
{  lineWidth=1;
 strokeStyle=toStr(lineColor);
 fillStyle=toStr(fillColor,fillAlpha);
 beginPath();
 for(var i=0;
 i<points.length;
 i++) lineTo(points[i].x, points[i].y);
 closePath();
 fill();
 stroke();
    if(gridAnchor) 
{ save();
 clip();
  beginPath();
 strokeStyle=toStr(gridColor);
 for(var i=gridAnchor.y+gridSize;
 i<bot;
 i+=gridSize)  
{ moveTo(0, i);
 lineTo(rt,i);
}
 for(i=gridAnchor.y;
 i>0;
 i-=gridSize)  
{ moveTo(0, i);
 lineTo(rt,i);
}
 for(i=gridAnchor.x+gridSize;
 i<rt;
 i+=gridSize)  
{ moveTo(i, 0);
 lineTo(i, bot);
}
 for(i=gridAnchor.x;
 i>0;
 i-=gridSize)  
{ moveTo(i, 0);
 lineTo(i, bot);
}
 stroke();
 restore();
  }
  var numPoints=points.length;
 if (labels && showLabels) 
{ for (var i=0;
 i<labels.length;
 i++) 
{ var p1=points[(i+numPoints-1)%numPoints] ;
  var p2=points[(i+1)%numPoints];
  var labAng=points[i].bisector(p1, p2, true);
 fillStyle=toStr(this.labelColor);
 font=this.labelFont;
 points[i].placeLabel(context, labels[i], labAng, labelRadius) }
 }
 }
  }
;
 this.crossed=function()  
{ with(this) 
{ var n=points.length;
  for (var j=0;
 j<n;
 j++)  
{ for(var k=j+2;
 k<j+(n-1);
 k++)  
{ var s2=k%n;
 var crosses=points[j].intersects(points[(j+1)%n], points[s2], points[(s2+1)%n]);
 if (crosses) return true;
 }
 }
 return false;
 }
 }
;
 }

function Polynomial(x, y, fontsize, color, bgColor, ital, bold) 
{ this.type="Polynomial";
  this.x=x? x : 0;
 this.y=y? y : 0;
 this.fontsize=fontsize? fontsize-2 : 10;
 this.color=color? color : 0x456789;
 this.ital=ital==undefined? true : ital;
 this.bold=bold==undefined? true : bold;
 this.visible=true;
 this.expr=new Array();
  this.xPos=this.x;
  this.radicalStart=0;
 Polynomial.prototype.setFonts=function()  
{ this.termFont="italic normal bold " + (this.fontsize) + "px sans-serif";
 this.superFont="italic normal bold " + (this.fontsize-3) + "px sans-serif";
 this.tallFont="normal normal normal " + (this.fontsize*2) + "px sans-serif";
 this.varFont="italic normal bold " + (this.fontsize) + "px sans-serif";
 this.opFont="normal normal bold " + (this.fontsize) + "px sans-serif";
 }
;
 this.setFonts();
 this.update=function() 
{   this.setFonts();
 this.xPos=this.x;
 for(var i=0;
 i<this.expr.length;
 i++) 
{ this.expr[i].layout();
 }
 }
;
 this.paint=function() 
{  if(!this.visible) return;
 with(context) 
{  save();
 fillStyle=toStr(this.color);
 textBaseline="top";
 strokeStyle=toStr(this.color);
 lineWidth=1;
 this.xPos=this.x;
   for(var i=0;
 i<this.expr.length;
 i++) 
{ this.expr[i].draw();
 }
 restore();
 }
 }
;
  this.term=function(t)  
{ this.expr.push( new termP(this, t) );
 }
;
 this.tallTerm=function(t)    
{ this.expr.push( new tallTermP(this, t) );
 }
;
 this.operator=function(op)  
{ this.expr.push( new operatorP(this, op) );
 }
;
 this.superScript=function(s)  
{ this.expr.push( new superScriptP(this, s, false) );
 }
;
 this.subScript=function(s)  
{ this.expr.push( new superScriptP(this, s, true) );
 }
;
 this.variable=function(v, decPlaces, plusSign, trailZeros, noOne)       
{ this.expr.push( new variableP(this, v, decPlaces, plusSign, trailZeros, noOne) );
 }
;
 this.xCoord=function(p, decPlaces, plusSign)     
{ this.expr.push( new coordP(this, p, decPlaces, plusSign, true) );
 }
;
 this.yCoord=function(p, decPlaces, plusSign)     
{ this.expr.push( new coordP(this, p, decPlaces, plusSign, false) );
 }
;
 this.radicStart=function()  
{ this.expr.push( new radicStartP(this) );
 }
;
 this.radicEnd=function()  
{ this.expr.push( new radicEndP(this) );
 }
;
 this.fraction=function(top, bot)  
{ this.expr.push( new fractionP(this, top, bot) );
 }
;
 this.tab=function(t)  
{ this.expr.push( new tabP(this, t) );
 }
;
 this.totalWidth=function()  
{ var totWid=0;
 for(var exprInx=0;
 exprInx<this.expr.length;
 exprInx++) 
{ var exp=this.expr[exprInx];
 if(exp.tab)  totWid=exp.tab;
 else totWid +=exp.wid;
 }
 return totWid;
 }
;
 }
   function termP(owner, s) 
{ this.owner=owner;
 this.s=s;
 this.wid=null;
 this.layout=function()  
{ context.font=owner.termFont;
 this.wid=context.measureText(s).width;
 }
;
 this.draw=function() 
{ context.font=owner.termFont;
 context.fillText(this.s , this.owner.xPos, this.owner.y);
 this.owner.xPos +=this.wid;
  }
;
 }
;
 function tallTermP(owner, s) 
{ this.owner=owner;
 this.s=s;
 this.wid=null;
 this.layout=function()  
{ context.font=owner.tallFont;
 this.wid=context.measureText(s).width;
 }
;
 this.draw=function() 
{ context.font=owner.tallFont;
 context.fillText(this.s , this.owner.xPos, this.owner.y - owner.fontsize/2);
 this.owner.xPos +=this.wid;
  }
;
 }
;
 function operatorP(owner, s) 
{ this.owner=owner;
 this.s=s;
 var m=1;
  this.wid=null;
 this.layout=function()  
{ context.font=owner.opFont;
 this.wid=context.measureText(s).width + m + m;
 }
;
 this.draw=function() 
{ context.font=owner.opFont;
 context.fillText(this.s, this.owner.xPos+m, this.owner.y);
 this.owner.xPos +=this.wid;
  }
;
 }
;
 function radicStartP(owner) 
{ this.owner=owner;
 this.wid=null;
 this.layout=function()  
{ this.wid=10;
 }
;
 this.draw=function() 
{  with(this.owner) 
{ var xl=xPos;
 var yl=y;
 var fs=fontsize;
 }
;
 with(context) 
{ beginPath();
 moveTo(xl+2, yl + fs-6);
 lineTo(xl+5, yl + fs-1);
 lineTo(xl+8, yl-5.5 );
 stroke();
 }
 owner.radicalStart=this.owner.xPos+10;
 this.owner.xPos +=this.wid;
  }
 }
;
 function radicEndP(owner) 
{ this.owner=owner;
 this.wid=null;
 this.layout=function()  
{ this.wid=0;
  }
;
 this.draw=function() 
{  with(context) 
{ beginPath();
 moveTo(owner.radicalStart-2, owner.y-5.5);
 lineTo(this.owner.xPos, owner.y-5.5);
 stroke();
 }
;
 this.owner.xPos +=this.wid;
  }
 }
;
 function superScriptP(owner, s, sub) 
{ this.owner=owner;
 this.s=s;
 this.sub=sub;
 this.wid=null;
 this.layout=function()  
{ context.font=owner.superFont;
 this.wid=context.measureText(s).width+1;
 }
 ;
 this.draw=function() 
{ context.font=owner.superFont;
  var yLoc=this.owner.y + (this.sub? +5 : -5);
 context.fillText(this.s , this.owner.xPos+1, yLoc);
 this.owner.xPos +=this.wid;
  }
;
 }
;
 function tabP(owner, t) 
{ this.owner=owner;
 this.tab=t;
  this.wid=null;
 this.layout=function()   
{ this.wid=0;
 }
;
 this.draw=function() 
{ this.owner.xPos=owner.x + this.tab;
  }
;
 }
;
 function fractionP(owner, top, bot) 
{ this.owner=owner;
 this.top=top;
 this.bot=bot;
 this.lineY=this.owner.y + this.owner.fontsize/2;
 this.wid=null;
 this.topWid=null;
 this.botWid=null;
 var m=2;
  this.layout=function()  
{ top.update();
 bot.update();
 this.topWid=top.totalWidth();
 this.botWid=bot.totalWidth();
 this.wid=Math.max(this.topWid, this.botWid) +m+m;
 }
;
 this.draw=function() 
{  with(context) 
{ lineWidth=1.5;
 beginPath();
 moveTo(this.owner.xPos, this.lineY);
 lineTo(this.owner.xPos+this.wid, this.lineY);
 stroke();
 }
;
    this.top.x=this.owner.xPos + (this.wid-this.topWid)/2;
 this.top.y=this.lineY - this.top.fontsize-1;
 this.top.paint();
 this.bot.x=this.owner.xPos + (this.wid-this.botWid)/2;
 this.bot.y=this.lineY +2;
 this.bot.paint();
 this.owner.xPos +=this.wid;
  }
;
 }
;
 function variableP(owner, v, decPlaces, plusSign, trailZeros, noOne) 
{ this.owner=owner;
 this.v=v;
 this.decPlaces=decPlaces || 0;
 this.plusSign=!!plusSign;
 this.trailZeros=trailZeros==undefined? true : false;
 this.noOne=!!noOne;
 this.wid=null;
 this.text=null;
 this.layout=function()  
{ context.font=owner.varFont;
 if(typeof v.val=="string") 
{ this.text=v.val;
 }
 else 
{ this.text=asString(v.val, this.decPlaces, this.plusSign, this.trailZeros);
 if(this.plusSign) this.text=addSign(this.text);
 if(this.noOne) 
{ if(v.val==1) 
{ if(this.plusSign ) this.text="+";
 else this.text="";
 }
 if(v.val==-1) this.text=minus;
 }
 }
 this.wid=context.measureText(this.text).width;
 }
;
 this.draw=function() 
{ context.font=owner.varFont;
 context.fillText(this.text , this.owner.xPos, this.owner.y);
 this.owner.xPos +=this.wid;
  }
;
 }
;
 function coordP(owner, v, decPlaces, plusSign, xval) 
{ this.owner=owner;
 this.decPlaces=decPlaces || 0;
 this.plusSign=!!plusSign;
 this.width=null;
 this.text=null;
 this.layout=function()  
{ context.font=owner.varFont;
 var cval=xval? v.getXInGridUnits() : v.getYInGridUnits();
 this.text=asString(cval, this.decPlaces, this.plusSign);
 if(this.plusSign) this.text=addSign(this.text);
 this.wid=context.measureText(this.text).width;
 }
;
 this.draw=function() 
{ context.font=owner.varFont;
 context.fillText(this.text , this.owner.xPos, this.owner.y);
 this.owner.xPos +=this.wid;
  }
;
 }
;

function RadiansDisplay() 
{ this.type="RadiansDisplay";
 this.ang=0;
 this.x=0;
 this.y=0;
 this.fontsize=12;
 this.color=0x000000;
 this.visible=true;
 this.fracTop;
 this.fracBot;
  this.negFrac=false;
 this.minusWidth=7;
 this.length=0;
 this.update=function() 
{}
;
 this.getWidth=function() 
{ this.prepTopBot();
  return this.length;
 }
;
 this.setAngle=function(angle) 
{ this.ang=Math.round(angle);
 }
;
 this.paint=function() 
{ this.prepTopBot();
 if(!this.visible) return;
 context.fillStyle=toStr(0x333333);
 var csr=this.x;
 if(this.negFrac) 
{ context.fillText("-", csr , this.y+18);
 csr +=this.minusWidth;
 }
 context.fillText(this.fracTop, csr , this.y+13);
 if(this.fracBot)  with(context)  
{ strokeStyle=toStr(0x444444);
 beginPath();
 moveTo(csr, this.y+15.5);
 lineTo(csr+this.length, this.y+15.5);
 stroke();
  context.fillText(this.fracBot, csr , this.y+26);
 }
 }
;
 this.prepTopBot=function()  
{ this.fracBot=false;
 this.negFrac=false;
  if(this.ang==0) 
{ this.fracTop="0";
 this.fracBot=false;
  this.length=this.measure(this.fracTop);
 }
 else if(Math.abs(this.ang%180)==0)  
{ var s="";
 if(this.ang<0) s="-";
 if (Math.abs(this.ang)!=180) s +=Math.abs(this.ang/180);
  this.fracTop=s + "\u03C0";
  this.fracBot=false;
  this.length=this.measure(this.fracTop);
 }
 else 
{  if(this.ang<0) 
{ this.negFrac=true;
 }
 if(Math.abs(this.ang)==90) this.fracTop="\u03C0";
 else this.fracTop=Math.abs(this.ang)/90 + "\u03C0";
 this.fracBot="2";
 this.length=this.measure(this.fracTop) + (this.negFrac)? this.minusWidth : 0;
 }
 }
;
 this.measure=function(item) 
{ var textMetrics=context.measureText(item);
 return textMetrics.width;
 }
 }

function Random(n) 
{ this.n=n==undefined? 0 : n;
 this.numList=[];
 this.index=0;
 this.fixedList= [ 0.27653962671756744, 0.4876787941902876, 0.6392678985372186, 0.7572411350905895, 0.358381456322968, 0.03594274539500475, 0.6280461261048913, 0.07564542721956968, 0.3151685851626098, 0.6926289116963744, 0.32237103302031755, 0.8710986808873713, 0.5988120059482753, 0.3048016019165516, 0.6779775940813124, 0.6369240288622677, 0.5225458415225148, 0.161801278591156, 0.20720935659483075, 0.8308263798244298 ];
 if(this.n==0) for (var i=0;
 i<20;
 i++) this.numList.push(this.fixedList[i]);
 else for (var i=0;
 i<n;
 i++) this.numList.push(Math.random());
  this.get=function() 
{ var nextNum=this.numList[this.index];
 this.index=(this.index+1) % this.numList.length;
 return nextNum;
 }
;
 this.reset=function(n) 
{ this.index=(n==undefined? 0 : n) % this.numList.length;
  }
;
 }
 
function Ruler(callback) 
{ this.type="Ruler";
 this.callback=callback;
 this.p1=null;
  this.p2=null;
 this.e1=30;
  this.e2=30;
 this.rulerVisible=true;
 this.pencilVisible=false;
 this.penX=null;
  this.timeout;
  this.defaultColor=0x555555;
  this.color=this.defaultColor;
 this.lineWid=1;
 this.pxPerTick=null;
 this.numSteps=800/15;
  this.paint=function() 
{ }
;
 this.erase=function() 
{ }
;
 this.reset=function()  
{ this.visible=false;
 this.pencilVisible=false;
 this.drawRuler();
  lineCtx.clearRect(0,0,600,370);
 }
;
 this.setColor=function(col, alph) 
{ this.color=col;
 }
;
 this.resetStyle=function() 
{ with(this) 
{ color=defaultColor;
 }
 }
;
 this.set=function(p1, p2, e1, e2) 
{ this.p1=p1;
 this.p2=p2;
 this.e1=e1==undefined? 30 : e1;
 this.e2=e2==undefined? 30 : e2;
 }
;
 this.show=function(delay)   
{ window.ruler=this;
  with(this) 
{ pencilVisible=false;
 visible=true;
 drawRuler();
 }
 if(this.exit(delay)) return;
 }
;
 this.hide=function(delay)   
{ this.visible=false;
 this.drawRuler();
 if(this.exit(delay)) return;
 }
;
 this.scribe=function(delay, s1p, s2p) 
{ this.delay=delay;
 this.s1=s1p==undefined? 20 : s1p;
  this.s2=s2p==undefined? 20 : s2p;
  var lineLength=this.p1.distance(this.p2) + this.s1 + this.s2;
 if(skin.fastFwd)  
{ with(lineCtx) with(this) 
{ drawFinalLine();
 callback();
 }
 }
 else  
{ this.pencilVisible=true;
 this.penX=-this.s1;
 this.drawRuler();
  timeout=setTimeout(this. doScribe, 500);
 }
 }
;
 this.doScribe=function() 
{ var owner=window.ruler;
 with(owner) 
{ pxPerTick=(p1.distance(p2) + s1 + s2) / numSteps;
 startTimer(15, numSteps, drawLine);
 }
 }
;
 this.drawLine=function() 
{ var owner=window.ruler;
 with(owner) 
{ penX +=pxPerTick;
 drawRuler(true);
  if(timer.numTicks==0) 
{  drawFinalLine();
 if(exit(delay)) return;
 }
 }
  }
;
 this.drawFinalLine=function() 
{ with(lineCtx) with(this) 
{ save();
 translate(p1.x, p1.y);
 rotate(-p1.theta(p2));
 strokeStyle=toStr(color);
 lineWidth=lineWid;
 beginPath();
 moveTo(-s1,0);
 lineTo(p1.distance(p2)+s2, 0);
 stroke();
 restore();
 }
 }
;
 this.drawRuler=function(withLine)   
{ var rulerLength;
 var rulerLeftEnd;
 var ticPitch=5;
 var rulerColor=0xFFFF66;
 var rulerAlpha=0.5;
 var rulerOutline=0x0000FF;
 var rulerWidth=12.5;
 var ticColor=0x8888ff;
 var pencilColor=0xFFFF00;
 var pencilOutline=0x888888;
 var pencilPointColor=0;
 var pencilWid=3;
 var pencilHt=50;
 var pointHt=5;
 toolCtx.clearRect(0,0,appletWidth, appletHeight);
 with(toolCtx) with(this) if(visible) 
{ rulerLength=this.p1.distance(this.p2) + this.e1 + this.e2;
 rulerLeftEnd=-this.e1;
  save();
 translate(this.p1.x, this.p1.y);
  rotate(-p1.theta(p2));
 if(rulerVisible)  
{ beginPath();
 strokeStyle=toStr(rulerOutline, 0.6);
 fillStyle=toStr(rulerColor, rulerAlpha);
 rect(rulerLeftEnd, 1, rulerLength, rulerWidth);
 fill();
 stroke();
  strokeStyle=toStr(ticColor);
 beginPath();
 for(var i=0;
 i<rulerLength;
 i+=ticPitch) 
{ moveTo(rulerLeftEnd+i,1);
 lineTo(rulerLeftEnd+i,4);
 }
 stroke();
 }
  if(pencilVisible) 
{ beginPath();
 strokeStyle=toStr(pencilOutline);
 fillStyle=toStr(pencilColor);
 rect( penX -(pencilWid/2), -pointHt-pencilHt, pencilWid, pencilHt );
 fill();
 stroke();
  beginPath();
 strokeStyle=toStr(pencilPointColor);
 moveTo(penX -(pencilWid/2) , -pointHt);
 lineTo(penX,0);
 lineTo(penX+(pencilWid/2) , -pointHt);
 stroke();
 }
 if(withLine) 
{  beginPath();
 strokeStyle=toStr(color);
 moveTo(-s1,0);
 lineTo(penX,0);
 stroke();
 }
;
 restore();
 }
 }
;
 this.exit=function(delay)   
{ if(delay==0) return true;
 with(this) 
{ if(skin.fastFwd) callback();
 else timeout=setTimeout(callback, delay);
 }
 }
;
 }

function Skin(callBack, scriptReset, compass, ruler)  
{ this.callBack=callBack;
  this.scriptReset=scriptReset;
   this.type="Skin";
 this.timer=null;
  this.endOfScript=false;
 this.procStep=null;
  this.targetStep=null;
  this.runMode=false;
  this.fastFwd=false;
  this.paint=function() 
{}
;
 this.update=function() 
{}
;
 this.reset=function() 
{ splash.style.visibility="hidden";
 explain.innerHTML="";
 goal.innerHTML="";
 this.procStep=0;
 clearTimeout(this.timer);
 }
;
  this.doNext=function(e) 
{ if (!e) var e=event;
 e.preventDefault();
 if(!skin.runMode) 
{ if(skin.endOfScript) 
{ skin.doReset(e);
  }
 else 
{ skin.disableControls();
 skin.callBack();
 }
 }
 }
;
 nextBtn.onmousedown=this.doNext;
 nextBtn.ontouchstart=this.doNext;
  this.stepBack=function(e)  
{ if (!e) var e=event;
 e.preventDefault();
 if(!skin.runMode) 
{ if(skin.procStep==0) return;
  skin.targetStep=skin.procStep-1;
   compass.reset();
 ruler.reset();
 skin.reset();
 skin.scriptReset();
  if(skin.targetStep==0) 
{ return;
 }
  skin.fastFwd=true;
 skin.disableControls();
 skin.callBack();
 }
 }
;
 backBtn.onmousedown=this.stepBack;
 backBtn.ontouchstart=this.stepBack;
  this.doRunStop=function(e) 
{ if (!e) var e=event;
 e.preventDefault();
 if (runBtn.value=="RUN") 
{ if(skin.endOfScript) 
{ skin.doReset(e);
  }
 else 
{ skin.runMode=true;
 skin.disableControls();
 skin.setButtonState([runBtn], false);
  autoRepeat.style.visibility="visible";
 artext.style.visibility="visible";
 runBtn.value="STOP";
 runBtn.style.color="red";
 skin.callBack();
 }
 }
 else  
{ skin.runMode=false;
 autoRepeat.style.visibility="hidden";
 artext.style.visibility="hidden";
 runBtn.value="RUN";
 runBtn.style.color="black";
 skin.enableControls();
 }
 }
;
 runBtn.onmousedown=this.doRunStop;
 runBtn.ontouchstart=this.doRunStop;
  this.doReset=function(e) 
{  if (!e) var e=event;
 e.preventDefault();
 skin.reset();
 runBtn.value="RUN";
 runBtn.style.color="black";
 skin.enableControls();
 autoRepeat.style.visibility="hidden";
 autoRepeat.checked=false;
 artext.style.visibility="hidden";
 skin.runMode=false;
 compass.reset();
 ruler.reset();
 skin.scriptReset();
  }
;
 resetBtn.onmousedown=this.doReset;
 resetBtn.ontouchstart=this.doReset;
  this.doSize=function(e) 
{ if (!e) var e=event;
 e.preventDefault();
 if(sizeBtn.value=="Close")  
{ window.close();
 }
 else 
{  if(location.href.indexOf("src")>0) var viewerPage="constappletframeDebug.html?applet="+appletName+"&wid="+appletWidth+"&ht="+appletHeight;
 else var viewerPage="constappletframe.html?applet="+appletName+"&wid="+appletWidth+"&ht="+appletHeight;
 var windowOptions="toolbar=no,,left=0,top=0,screenX=0,screenY=0,height="+screen.availHeight+",width="+screen.availWidth;
 var win=open(viewerPage , '_blank', windowOptions);
 }
 }
;
 sizeBtn.onmousedown=this.doSize;
 sizeBtn.ontouchstart=this.doSize;
 this.splashPage=function() 
{ with(this) 
{ if(autoRepeat.checked) callBack();
  else with(splash.style) 
{ visibility="visible";
  top=(150*bScale) + "px";
 fontSize=(21*bScale) + "px";
 }
 }
 }
;
 this.unSplash=function(delay)    
{ with(this) 
{ splash.style.visibility="hidden";
 if(delay && delay>0 ) this.timer=setTimeout(callBack, delay);
 else return;
 }
 }
;
 this.explainNext=function(str, delay, goalStr)     
{  this.procStep++;
  if (this.runMode && !this.endOfScript) explain.innerHTML="";
 else 
{ explain.innerHTML=str;
 explain.style.fontSize=(14*bScale) + "px";
 }
  if ((this.runMode && !this.endOfScript) || goalStr==undefined) 
{ goal.innerHTML="";
 }
 else 
{ goal.innerHTML=goalStr;
 goal.style.fontSize=(14*bScale) + "px";
 }
  if(goal.innerHTML=="")  explain.style.top="0";
 else explain.style.top=(20*bScale) + "px";
  if(this.fastFwd) 
{ if (this.procStep==this.targetStep) 
{ this.fastFwd=false;
 this.enableControls();
   if(compass.visible) compass.drawCompass();
 if(ruler.visible) ruler.drawRuler();
  }
 else 
{  this.callBack();
 }
 return;
 }
 if(this.runMode) 
{ var wait;
 if (delay && delay>0) wait=delay;
 else wait=0;
 this.timer=setTimeout(callBack, wait);
 }
 else 
{ this.enableControls();
  }
 }
;
 this.enableControls=function() 
{ this.setButtonState([nextBtn, backBtn, runBtn, resetBtn, sizeBtn] , false);
 }
;
 this.disableControls=function() 
{ this.setButtonState([nextBtn, backBtn, runBtn, resetBtn, sizeBtn] , true);
 }
;
 this.setButtonState=function(buttons, mode)  
{ for(var j=0;
 j<buttons.length;
 j++) 
{ buttons[j].disabled=mode;
 buttons[j].style.color=mode? "gray" : "black";
 }
 }
;
 this.scriptStart=function() 
{ this.endOfScript=false;
 this.procStep=0;
 window.skin=this;
  compass.resetStyle();
 ruler.resetStyle();
  tools.width=tools.width*bScale;
 tools.height=tools.height*bScale;
 toolCtx.scale(bScale, bScale);
 lines.width=tools.width*bScale;
 lines.height=tools.height*bScale;
 lineCtx.scale(bScale, bScale);
 }
;
 this.scriptEnd=function() 
{ if(autoRepeat.checked) 
{  this.timer=setTimeout(this.startOver, 2000);
 }
 else 
{ this.endOfScript=true;
 this.runMode=false;
 runBtn.value="RUN";
 autoRepeat.style.visibility="hidden";
 artext.style.visibility="hidden";
 autoRepeat.checked=false;
 }
 }
;
 this.startOver=function()  
{ compass.reset();
 ruler.reset();
 skin.reset();
 skin.scriptReset();
 }
;
 this.pause=function(delay)  
{ if (this.fastFwd) this.callBack();
  else this.timer=setTimeout(this.callBack, delay);
  }
;
 }
 
function SliderControl(owner, label, xLoc, yLoc, ht, callback, rangeDlg, high, low, val, snap, showReadout) 
{ this.type="SliderControl";
 this.owner=owner;
  this.label=label;
 this.x=xLoc;
 this.y=yLoc;
 this.sliderHt=ht;
 this.callback=callback;
 this.rangeDlg=rangeDlg;
 this.high=high;
 this.low=low;
 this.val=val;
 this.snap=snap;
 this.hiLabel;
 this.loLabel;
 this.showReadout=showReadout;
  this.readout=false;
   this.chanTop=this.showReadout? 49 : 26;
 this.sliderPos=0;
  this.width=12;
 this.visible=true;
  this.drawn=false;
  this.dragging=false;
  this.inSlider=false;
   this.can=document.createElement('canvas');
 with( this.can) 
{ with(style) 
{ position="absolute";
 left=(this.x)*bScale + "px";
 top=(this.y)*bScale + "px";
 visibility="hidden";
  }
 height=(this.sliderHt + (this.showReadout? 49 : 26)) * bScale;
 width=(40) *bScale;
 }
  var bod=document.getElementsByTagName('body')[0];
 bod.appendChild(this.can);
 this.ctx=this.can.getContext('2d');
 this.ctx.scale(bScale, bScale);
  this.labl=new TextObj(this.x, this.y+2, label, 0x0064c8, true, true, 15, 18);
 addChild(this.labl);
 this.update=function() 
{}
;
 this.setHigh=function(val) 
{ this.high=val;
 this.hiLabel.text=" "+val;
 }
;
 this.setLow=function(val) 
{ this.low=val;
 this.loLabel.text=" "+val;
 }
;
 this.paint=function() 
{   if(!this.drawn) with(this) 
{ drawn=true;
 setSliderPos();
 this.hiLabel=addTic(this.high, false);
 this.loLabel=addTic(this.low, false);
 can.ownr=this;
  if(showReadout=="input") 
{ this.readout=new TextField();
 with(this.readout) 
{ x=this.x-5;
 y=this.y+24;
 fontSize=12;
 width=30;
 height=15;
 border=true;
 borderColor=0x888888;
 background=true;
 backgroundColor=0xeeeeee;
 textColor=0x000099;
 update();
 }
 addChild(this.readout);
 }
 can.onmousedown=this.mouseDn;
 onmousemove=this.drag;
 onmouseup=this.endDrag;
 can.addEventListener("mousemove", this.csrCheck);
 can.addEventListener("touchstart", this.mouseDn, false);
 can.addEventListener("touchmove", this.touchDrag, false);
 can.addEventListener("touchend", this.endDrag, false);
 }
 this.can.style.visibility=(this.visible)? "visible" : "hidden";
 this.drawCtrl();
 }
;
 this.setSliderPos=function()  
{  with(this) 
{ var range=high-low;
  var fraction=(val-low)/range;
  this.sliderPos=this.sliderHt-6 - ((this.sliderHt-12)*fraction);
 }
 }
;
 this.setVal=function()  
{ var hi=new Number(this.high);
 var lo=new Number(this.low);
 var range=hi - lo;
  var yRange=this.sliderHt-12;
  var k=this.sliderHt-this.sliderPos-6;
 var yFrac=k / yRange;
 var vFrac=range*yFrac;
 this.val=lo + vFrac;
   if(this.snap) this.val=Math.round(this.val);
 }
;
 this.addTic=function(tgtVal, dash) 
{ with(this) 
{  var range=high-low;
  var yRange=sliderHt-12;
  var fraction=(tgtVal-low)/range;
  var yPos=y + chanTop + (this.sliderHt-6 - ((this.sliderHt-12)*fraction)) - 7;
 var str=(dash)? "\u2013"+tgtVal : " "+tgtVal;
 var tic=new TextObj(this.x+18, yPos, str, 0x777777, true, true, 12);
 addChild(tic);
 return tic;
 }
 }
;
 this.updateLimits=function() 
{ this.paint();
 this.hiLabel.text=this.high;
  this.loLabel.text=this.low;
   }
;
 this.getThumb=function()  
{ return this.sliderPos;
 }
;
 this.getValueFromSlider=function() 
{ return this.val;
 }
;
 this.getValue=function()  
{ return this.val;
 }
;
 this.setValue=function(v) 
{ with(this) 
{ val=v;
 val=Math.max(val, low);
 val=Math.min(val, high);
 setSliderPos();
 setReadout(val);
 }
 }
;
 this.getValueFromReadout=function()   
{ if(this.showReadout=="input") return this.readout.getValue();
 else return "";
 }
;
 this.setReadout=function(v)    
{ if(this.showReadout=="input") 
{ this.readout.setValue( roundtoN(v,1) );
 }
 }
;
 this.drawCtrl=function() 
{ var chanLeft=5.5;
 var chanWidth=12;
 with(this) with(ctx) 
{ clearRect(0,0, can.width, can.height);
 fillStyle="#cccccc";
 fillRect(chanLeft, chanTop, chanWidth, sliderHt);
 strokeStyle=toStr(0x000000,1);
 beginPath();
 moveTo(chanLeft+chanWidth, chanTop);
 lineTo(chanLeft, chanTop);
 lineTo(chanLeft, chanTop+sliderHt);
 stroke();
  var st=this.sliderPos-6+this.chanTop;
  var sl=chanLeft;
  fillStyle="#aaaaaa";
 fillRect(sl, st, 10, 12);
  strokeStyle=toStr(0x000000,1);
 lineWidth=1;
 beginPath();
  moveTo(sl, st+12.5);
 lineTo(sl+11, st+12.5);
  lineTo(sl+11, st);
  stroke();
 beginPath();
  strokeStyle=toStr(0xeeeeee,1);
 moveTo(sl, st);
 lineTo(sl+12, st);
 stroke();
 beginPath();
  strokeStyle=toStr(0xffffff,1);
 moveTo(sl+6, st+6.5);
 lineTo(sl+12, st+6.5);
 stroke();
  if(this.showReadout && this.showReadout!="input") 
{ fillStyle="#6789ab";
 font="normal normal bold 14px arial";
 fillText(roundtoN(this.val,1), 4,36);
 }
 }
 this.drawn=true;
 }
;
 this.mouseDn=function(e) 
{ if (!e) var e=event;
 e.preventDefault();
 hideHints();
 draggedObject= e.currentTarget.ownr;
  e.currentTarget.ownr.dragging=true;
 }
;
 this.drag=function(e) 
{ if (!e) var e=event;
 e.preventDefault();
 if(draggedObject) with(draggedObject) 
{ if(dragging) 
{  sliderPos=(e.pageY/bScale) - y - chanTop;
  sliderPos=Math.min(sliderPos, sliderHt-6);
 sliderPos=Math.max(sliderPos, 6);
 setVal();
  setReadout(val);
 }
 if(callback) callback();
 }
 }
;
 this.touchDrag=function(e) 
{ if (!e) var e=event;
 e.preventDefault();
 if(draggedObject) with(draggedObject) 
{ if(dragging) 
{  sliderPos=(e.targetTouches[0].pageY/bScale) - y - chanTop;
  sliderPos=Math.min(sliderPos, sliderHt-6);
 sliderPos=Math.max(sliderPos, 6);
 setVal();
  setReadout(val);
 }
 if(callback) callback();
 }
 }
;
 this.endDrag=function(e) 
{ if (!e) var e=event;
 e.preventDefault();
 if(draggedObject) with(draggedObject) 
{ dragging=false;
 can.style.cursor="default";
 draggedObject= false;
 }
 }
;
 this.csrCheck=function(e) 
{ if (!e) var e=event;
 e.preventDefault();
 with(e.currentTarget.ownr) 
{   var my=(e.pageY/bScale) - chanTop -y ;
 var mx=(e.pageX/bScale) - x - 5.5 ;
  inSlider=(my>sliderPos-7 && my<sliderPos+7 && mx>0 && mx<12);
 if (inSlider) can.style.cursor="pointer";
 else can.style.cursor="default";
 }
 }
;
 }

function Sprite() 
{ this.type="Sprite";
 this.x=0;
 this.y=0;
 this.rotation=0;
 this.displayList=[];
 this.numChildren=0;
  this.visible=true;
 this.can=canvas;
 this.graphics=new Graphics(context);
  this.addChild=function(obj) 
{ this.displayList.push(obj);
 this.numChildren++;
  obj.parentSprite=this;
   if(obj.isPoint) pointList.push(obj);
 return obj;
  }
;
 this.getChildAt=function(i) 
{ return this.displayList[i];
 }
;
 this.removeChild=function(obj) 
{ if(obj=="all") 
{ this.clearDisplayList();
 return;
 }
  for(var i=0;
 i<this.displayList.length;
 i++) 
{ if(this.displayList[i]==obj)  
{ this.displayList.splice(i,1);
  return;
 }
 }
 }
;
 this.clearDisplayList=function() 
{  for(var i=0;
 i<this.displayList.length;
 i++) 
{ var obj=this.displayList[i];
 if(obj.isPoint) 
{ for(var k=0;
 k<pointList.length;
 k++)  
{ if(pointList[k]===obj) 
{ pointList.splice(k,1);
 break;
 }
 }
 }
 }
  this.displayList=[];
 }
;
 this.paint=function() 
{ if(!this.visible) return;
 context.save();
 if(this.mask) with(this.mask) with(context) 
{ strokeStyle="rgba(0,0,0,0)";
  beginPath();
 rect(x,y,wid,ht);
 closePath();
 stroke();
 clip();
 }
 this.graphics.render(this.x, this.y, this.rotation);
 for(var i=0;
 i<this.displayList.length;
 i++) 
{ this.displayList[i].paint();
 }
 context.restore();
 }
;
 }
  function Shape()    
{ var shape=new Sprite();
 shape.type="Shape";
 return shape;
 }
;

function TextField()  
{ this.type="TextField";
 this.x=100;
 this.y=100;
 this.width=100;
 this.height=18;
 this.border=true;
 this.borderColor=0x888888;
 this.background=true;
 this.backgroundColor=0xffffff;
 this.textColor=0x000099;
 this.fontSize=13;
  this.inpNode=false;
 this.visible=true;
 var inp=document.createElement('input');
 inp.setAttribute('type', 'text');
 this.inpNode=document.body.appendChild(inp);
 this.update=function() 
{ with(this.inpNode.style) 
{ position="absolute";
 left=this.x*bScale +"px";
 top=this.y*bScale +"PX";
 height=this.height*bScale +"px";
 width=this.width*bScale +"px";
 border=bScale+"px solid "+toStr(this.borderColor);
 background=toStr(this.backgroundColor);
 color=toStr(this.textColor);
 fontSize=this.fontSize*bScale +"px";
 verticalAlign="middle";
 zIndex=200;
  padding=0;
 }
 }
;
 this.reset=function() 
{}
;
 this.paint=function() 
{ this.inpNode.style.visibility=this.visible? "visible" : "hidden";
 this.update();
  }
;
 this.getValue=function() 
{ return this.inpNode.value;
 }
;
 this.setValue=function(val) 
{ this.inpNode.value=val;
 }
;
 this.isBlank=function() 
{ return this.inpNode.value.length==0;
 }
;
 this.setStyle=function() 
{ }
;
 }
 
function TextObj(xLoc, yLoc, text, color, bold, italic, size, wid) 
{ this.type="TextObj";
  this.x=xLoc==undefined? 20 : xLoc;
 this.y=yLoc==undefined? 20 : yLoc;
 this.text=text==undefined? "Text" : text;
 this.color=color? color : 0x222222;
 this.bold=!!bold;
 this.italic=!!italic;
 this.size=size==undefined? 12 : size;
 this.wid=wid;
 this.visible=true;
 this.update=function() 
{}
;
 this.paint=function() 
{ if(!this.visible) return;
 with(this) 
{ with(context)  
{ save();
 font=makeFont();
 fillStyle=toStr(color);
 }
 var newX;
 if(wid) 
{ newX=x + wid/2 - getWidth()/2;
 textAlign="center";
 }
 else 
{ newX=x;
 textAlign="left";
 }
 with(context) 
{ fillStyle=toStr(color);
 fillText(text, newX, y+size);
 restore();
 }
 }
  }
;
  this.makeFont=function() 
{ var newFont="";
 if(this.italic) newFont +="italic normal ";
 else newFont +="normal normal ";
 if(this.bold) newFont +="bold ";
 else newFont +="normal ";
 newFont +=this.size;
 newFont +="px sans-serif";
 return newFont;
 }
;
 this.getWidth=function() 
{ var wid;
 with(context) 
{ save();
 font=this.makeFont();
 wid=measureText(this.text).width;
 restore();
 }
 return wid;
 }
;
 this.getHeight=function() 
{ return this.size;
 }
;
 }

function Ticmarks(aPt, bPt, tics, posn) 
{ this.type="Ticmarks";
 this.a=aPt;
 this.b=bPt;
 this.numTics=tics? tics : 1;
 this.position=posn? posn : 50;
  this.lineColor=stdLineColor;
 this.visible=true;
 this.ticSize=3;
  this.ticSpacing=4;
 this.update=function() 
{}
;
 this.paint=function() 
{ if(!this.visible) return;
 var len=this.a.distance(this.b);
  with(context) 
{ save();
 translate(this.a.x, this.a.y);
 rotate(-this.a.theta(this.b));
 lineWidth=1;
 strokeStyle=toStr(this.lineColor);
  var ticGroupWidth=((this.numTics-1)*this.ticSpacing) + 1;
 var ticX ;
 if(ticGroupWidth < len-10)  
{  var firstTic=len*this.position/100;
     beginPath();
 for (var t=0;
 t < this.numTics;
 t++) 
{ ticX=firstTic + (t * this.ticSpacing);
 moveTo(ticX, this.ticSize);
 lineTo(ticX, -this.ticSize);
 }
 stroke();
 }
 restore();
 }
 }
 }

