function bpm(node) { // borrows heavily from bpm's mechanism
    node = node.firstChild;
    var depth = 1;
    while (true) {
        if(!bpm.tag_blacklist[node.tagName]) {
            if (node.hasChildNodes()) {
                node = node.firstChild;
                depth++;
                continue;
            }

            if (node.nodeType === Node.TEXT_NODE) {
                var matches = node.data.split(bpm.emote_regexp);
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
                var text = '[](' + node.getAttribute('href');  
                text += node.hasAttribute('title') ? ' "' + node.title + '")' : ')';

                var replacement = document.createElement('span');
                replacement.appendChild(document.createTextNode(text));

                var parent = node.parentNode;
                parent.insertBefore(replacement, node);
                parent.removeChild(node);
                node = replacement;
            }
        }

        while (node.nextSibling === null) {
            node = node.parentNode;
            if (--depth === 0) return;
        }

        node = node.nextSibling;
    }
} // Edited from bpm:     <   emote     >   <      alt-text   >
bpm.emote_regexp = /(\[\]\(\/[\w:!#\/\-]+\s*(?:["'][^"]*["'])?)\)/g;
// Copied from bpm:
bpm.tag_blacklist = {
    // Meta tags we should never touch
    "HEAD": 1, "TITLE": 1, "BASE": 1, "LINK": 1, "META": 1, "STYLE": 1, "SCRIPT": 1,
    // Things I'm worried about
    "IFRAME": 1, "OBJECT": 1, "CANVAS": 1, "SVG": 1, "MATH": 1, "TEXTAREA": 1
};