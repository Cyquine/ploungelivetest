'use strict';
liveComments.bpm = function(node) { // borrows heavily from bpm's mechanism
    for (var textNodeWalker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT),
             textNode; textNode = textNodeWalker.nextNode();) {
        var matches = textNode.data.split(liveComments.bpm.emoteRegexp);
        if (matches.length > 1) { // split emote over 2 text nodes
            textNode.data = ')' + matches.pop();
            var parent = textNode.parentNode;
            parent.insertBefore(document.createTextNode(
                                  matches.shift() + matches.shift()), textNode);
            while (matches.length > 0) {
                parent.insertBefore(document.createTextNode(')' +
                                  matches.shift() + matches.shift()), textNode);
            }
        }
    }

    for (var links = node.getElementsByTagName('a'), link, i = 0;
                                       i < links.length, link = links[i]; i++) {
        if (link.hasChildNodes()) {
            link.target = '_blank';
            if (link.host === window.location.host) {
                link.href = '//reddit.com' + link.pathname;
            }
        } else { // an anchor having no text is a good sign of it being an emote
            link.parentNode.replaceChild(document.createTextNode('[](' +
                            link.pathname + (link.hasAttribute('title') ? ' "' +
                                               link.title + '")' : ')')), link);
        }
    }
};
// Edited from bpm:                      <  emote   >   <    alt-text     >
liveComments.bpm.emoteRegexp = /(\[\]\(\/[\w:!#\/\-]+\s*(?:["'][^"]*["'])?)\)/;

liveComments.bpm.enabled = false;
liveComments.bpm.toggle = function() {
    bpm.enabled = !bpm.enabled;
};