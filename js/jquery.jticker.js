// jquery.ticker.js
// 0.9.1 - beta
// Stephen Band
//
// Project and documentation site:
// http://webdev.stephband.info/jticker/
//
// Dependencies:
// jQuery 1.2.3 - (www.jquery.com)
//
// Instantiate and play with:
// jQuery(element).ticker({options}).trigger("play");


(function(jQuery) {

// VAR

var name = "ticker";   // Name of the plugin

// FUNCTIONS

function indexify(i, length) {
    return (i >= length) ? indexify(i-length, length) : ((i < 0) ? indexify(i+length, length) : i) ;
}

function advanceItem(elem) {
    var data = elem.data(name);
    var length;
    for (var i=0; i<200; i++) {
        if (!data.content[i]) {length = i; break;} 
    }
    data.nextItem      = indexify((data.nextItem || 0), length);
    data.currentItem   = data.nextItem;
    data.elemIndex     = [data.currentItem];
    data.charIndex     = 0;
    data.nextItem++;
}

function makeFamily(elem) {
    var obj = {elem: elem.clone().empty()};
    var children = elem.children();
    if (children.length) {
        children.each(function(i){
            obj[i] = makeFamily(jQuery(this));
        });
        return obj;
    }
    else {
        obj.text = elem.text()
        return obj;
    }
}

function checkFamily(content, index) {
    var newIndex;
    if (content[index[0]]) {
        if (content[index[0]].text) {return content[index[0]];}
        else if (index.length == 1) {return true;}
        else {
            newIndex = jQuery.makeArray(index);
            return checkFamily(content[newIndex[0]], newIndex.splice(1, newIndex.length));
        }
    }
    else {return false;}
}  

function incrementIndex(index) {
    if (index.length > 1)   {index[index.length-1]++;
                             return index;}
    else                    {return false;}
}

function buildIndex(content, index) {
    if (index === false)    {return false;}
    var obj = checkFamily(content, index);
    if (obj === false)      {return buildIndex(content, incrementIndex(index.slice(0, index.length-1)));}
    else if (obj === true)  {index[index.length] = 0;
                             return buildIndex(content, index);}
    else                    {return index;}
}

function buildFamily(elem, content, index, data) {
    var newIndex, newElem;
    var child = elem.children().eq(index[0]);
    
    if (!index.length) {
        return {
            readout: elem,
            text: content.text
        };
    }
    else if (child.length)  {newElem = child;}
    else                    {newElem = content[index[0]].elem.appendTo(elem);}
    
    newIndex = jQuery.makeArray(index).slice(1, index.length);
    return buildFamily(newElem, content[index[0]], newIndex, data);
}

function initElem(elem) {
    var data = elem.data(name);
    jQuery("*", elem).empty();
    elem.empty();
    data.start = 0;
    data.sum = 0;
    if (data.cursorIndex) {cursorIndex = 0;}
}

function initChild(elem) {
    var data = elem.data(name);
    data.start = data.sum;
}

function ticker(elem, threadIndex, data) {
    var index, letter;
    
    // Switch cursor
    if (data.cursorIndex !== false)  {data.cursorIndex = indexify(data.cursorIndex+1, data.cursorList.length);
                                      data.cursor.html(data.cursorList[data.cursorIndex]);}
    else                             {data.cursor.html(data.cursorList);}

    // Add character to readout
    index = data.charIndex - data.start;
    letter = data.text.charAt(index-1);
    data.cursor.before(letter);
    
    if (data.charIndex >= data.sum) {
        data.cursor.remove();
        data.elemIndex = incrementIndex(data.elemIndex);
        return tape(elem, threadIndex);
    }
    else {
        return setTimeout(function(){
            if (data.eventIndex == threadIndex) {
                data.charIndex++;
                ticker(elem, threadIndex, data);
            }
            threadIndex = null;
        }, data.rate);   
    }
}

function tape(elem, threadIndex) {
    var data = elem.data(name);

    if (data.eventIndex == threadIndex) {
        
        data.elemIndex = buildIndex(data.content, data.elemIndex);
        //console.log('INDEX '+data.elemIndex);
        
        if (data.elemIndex === false) {
            return setTimeout(function(){
                if (data.running && (data.eventIndex == threadIndex)) {
                    advanceItem(elem);
                    return tape(elem, threadIndex);
                }
                threadIndex = null;
            }, data.delay);
        }
        else if (!data.charIndex)                       {initElem(elem);}
        else                                            {initChild(elem);}

        jQuery.extend(data, buildFamily(elem, data.content, data.elemIndex));
        data.sum = data.sum + data.text.length;
        data.readout.append(data.cursor);
        return ticker(elem, threadIndex, data);
    }
}

// PLUGIN DEFINITION

jQuery.fn[name] = function(options) {

    // Add or overwrite options onto defaults
    var o = jQuery.extend({}, jQuery.fn.ticker.defaults, options);

    // Iterate matched elements
    return this.each(function() {

        var elem = jQuery(this);
        
        elem
        .data(name, {
            rate:           o.rate,
            delay:          o.delay,
            content:        makeFamily(elem),
            cursor:         o.cursor,
            cursorList:     o.cursorList,
            cursorIndex:    (typeof(o.cursorList) == "object") ? 0 : false,
            nextItem:       0,
            eventIndex:     0
        })
        .bind("stop", function(e){
            var data = elem.data(name);
            data.running = false;           
        })
        .bind("play", function(e){
            var data = elem.data(name);
            data.eventIndex++;
            data.running = true;
            data.nextItem = (e.item || data.nextItem);
            advanceItem(elem);
            tape(elem, data.eventIndex);
        })
        .bind("control", function(e){
            var data = elem.data(name);
            jQuery().extend(data, {
                nextItem:   e.item,
                rate:       e.rate,
                delay:      e.delay
            });
        })
        .children()
        .remove();
    });
};

// PLUGIN DEFAULTS

jQuery.fn[name].defaults = {
    rate:           40,         // Speed to print message.
    delay:          2000,       // Pause to read message.
    cursorList:     "_",        // A string or an array of strings or jQuery objects. If an array, the cursor loops through the array.
    cursor:         jQuery('<span class="cursor" />')
}

})(jQuery);