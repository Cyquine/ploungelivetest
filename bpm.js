'use strict';
liveComments.bpm = function(node) { // borrows heavily from bpm's mechanism
    node = node.firstChild;
    var depth = 1;
    while (true) {
        if (node.nodeType === 3) { // Node.TEXT_NODE == 3, signifies escaped emote
            var matches = node.data.split(liveComments.bpm.emoteRegexp);
            if (matches.length > 1) { // splits emote over 2 text nodes
                node.data = ')' + matches.pop();
                var parent = node.parentNode;
                parent.insertBefore(document.createTextNode(
                                  matches.shift() + matches.shift()), node);
                while (matches.length > 0) {
                    parent.insertBefore(document.createTextNode(')' +
                                  matches.shift() + matches.shift()), node);
                }
            }
        } else if (node.tagName === 'A') { // an anchor having no text is a
                                           // good sign of it being an emote

            if (node.hasChildNodes()) {
                node.target = '_blank';
                if (node.host === window.location.host) {
                    node.href = '//reddit.com' + node.getAttribute('href');
                }
            } else {
                var text = '[](' + node.getAttribute('href');
                text += node.hasAttribute('title') ? ' "' + node.title + '")' : ')';

                var replacement = document.createElement('span');
                replacement.appendChild(document.createTextNode(text));

                var parent = node.parentNode;
                parent.insertBefore(replacement, node);
                parent.removeChild(node);
                node = replacement.firstChild;
            }
        }

        if (node.hasChildNodes()) {
            node = node.firstChild;
            depth++;
            continue;
        } else {
            while (!node.nextSibling) {
                node = node.parentNode;
                if (--depth) return;
            }
            node = node.nextSibling;
        }
    }
};
// Edited from bpm:                      <  emote   >   <    alt-text     >
liveComments.bpm.emoteRegexp = /(\[\]\(\/[\w:!#\/\-]+\s*(?:["'][^"]*["'])?)\)/g;

liveComments.bpm.enabled = false;
liveComments.bpm.toggle = function() {
    bpm.enabled = !bpm.enabled;
};