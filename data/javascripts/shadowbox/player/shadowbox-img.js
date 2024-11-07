(function(){var SB=Shadowbox;var SL=SB.lib;var C=SB.getClient();var drag;var draggable;var drag_id='shadowbox_drag_layer';var preloader;var resetDrag=function(){drag={x:0,y:0,start_x:null,start_y:null}};var toggleDrag=function(on,h,w){if(on){resetDrag();var styles=['position:absolute','height:'+h+'px','width:'+w+'px','cursor:'+(C.isGecko?'-moz-grab':'move'),'background-color:'+(C.isIE?'#fff;filter:alpha(opacity=0)':'transparent')];SL.append(SL.get('shadowbox_body_inner'),'<div id="'+drag_id+'" style="'+styles.join(';')+'"></div>');SL.addEvent(SL.get(drag_id),'mousedown',listenDrag)}else{var d=SL.get(drag_id);if(d){SL.removeEvent(d,'mousedown',listenDrag);SL.remove(d)}}};var listenDrag=function(e){SL.preventDefault(e);var coords=SL.getPageXY(e);drag.start_x=coords[0];drag.start_y=coords[1];draggable=SL.get('shadowbox_content');SL.addEvent(document,'mousemove',positionDrag);SL.addEvent(document,'mouseup',unlistenDrag);if(C.isGecko)SL.setStyle(SL.get(drag_id),'cursor','-moz-grabbing')};var unlistenDrag=function(){SL.removeEvent(document,'mousemove',positionDrag);SL.removeEvent(document,'mouseup',unlistenDrag);if(C.isGecko)SL.setStyle(SL.get(drag_id),'cursor','-moz-grab')};var positionDrag=function(e){var content=SB.getContent();var dims=SB.getDimensions();var coords=SL.getPageXY(e);var move_x=coords[0]-drag.start_x;drag.start_x+=move_x;drag.x=Math.max(Math.min(0,drag.x+move_x),dims.inner_w-content.width);SL.setStyle(draggable,'left',drag.x+'px');var move_y=coords[1]-drag.start_y;drag.start_y+=move_y;drag.y=Math.max(Math.min(0,drag.y+move_y),dims.inner_h-content.height);SL.setStyle(draggable,'top',drag.y+'px')};Shadowbox.img=function(id,obj){this.id=id;this.obj=obj;this.resizable=true;this.ready=false;var self=this;preloader=new Image();preloader.onload=function(){self.height=self.obj.height?parseInt(self.obj.height,10):preloader.height;self.width=self.obj.width?parseInt(self.obj.width,10):preloader.width;self.ready=true;preloader.onload='';preloader=null};preloader.src=obj.content};Shadowbox.img.prototype={markup:function(dims){return{tag:'img',id:this.id,height:dims.resize_h,width:dims.resize_w,src:this.obj.content,style:'position:absolute'}},onLoad:function(){var dims=SB.getDimensions();if(dims.drag&&SB.getOptions().handleOversize=='drag'){toggleDrag(true,dims.resize_h,dims.resize_w)}},remove:function(){var el=SL.get(this.id);if(el)SL.remove(el);toggleDrag(false);if(preloader){preloader.onload='';preloader=null}}}})();