(function(){var SB=Shadowbox;var SL=SB.lib;var C=SB.getClient();Shadowbox.iframe=function(id,obj){this.id=id;this.obj=obj;this.height=this.obj.height?parseInt(this.obj.height,10):SL.getViewportHeight();this.width=this.obj.width?parseInt(this.obj.width,10):SL.getViewportWidth()};Shadowbox.iframe.prototype={markup:function(dims){var markup={tag:'iframe',id:this.id,name:this.id,height:'100%',width:'100%',frameborder:'0',marginwidth:'0',marginheight:'0',scrolling:'auto'};if(C.isIE){markup.allowtransparency='true';if(!C.isIE7){markup.src='javascript:false;document.write("");'}}return markup},onLoad:function(){var win=(C.isIE)?SL.get(this.id).contentWindow:window.frames[this.id];win.location=this.obj.content},remove:function(){var el=SL.get(this.id);if(el){SL.remove(el);if(C.isGecko)delete window.frames[this.id]}}}})();