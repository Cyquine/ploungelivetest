'use strict';
liveComments.Comment = function(data, opt_submitter) {
    this.id = data.id;
    this.submission = data.link_id.slice(3);
    this.created = 1000*data.created_utc;
    this.timestampTimeouts = {};
    if (!opt_submitter) {
        this.parentChain = data.parent_id[1] === '1' ?
                           [data.id, data.parent_id.slice(3)] : [data.id, ''];
    }

    this.element = (function() {
        var loadParent = document.createElement('button');
        loadParent.className = 'parent loader';
        loadParent.onclick = this.fetchParent;

        var minimiser = document.createElement('button');
        minimiser.className = 'minimiser loader';
        minimiser.onclick = this.minimise;

        var loadChild = document.createElement('button');
        loadChild.className = 'child loader';
        loadChild.onclick = this.fetchChild;

        var permalink = document.createElement('a');
        permalink.className = 'permalink';
        permalink.target = '_blank';
        permalink.href = '//reddit.com/r/' + data.subreddit + '/comments/' +
                            data.link_id.slice(3) + '/x/' + data.id;

        var author;
        if (data.author === '[deleted]') {
            author = document.createElement('p');
            author.className = 'author';
        } else {
            author = document.createElement('a');
            author.href = '//reddit.com/u/' + data.author;
            author.target = '_blank';
            author.className = 'author' + (data.author === (opt_submitter ||
                                data.link_author) ? ' submitter' : '');
        }
        author.appendChild(document.createTextNode(data.author));

        var created = document.createElement('time'),
            createdTime = new Date(this.created);
        created.appendChild(document.createTextNode(''));
        created.className = 'created';
        created.datetime = createdTime.toISOString();
        created.title = createdTime.toString();

        var header = document.createElement('div');
        header.appendChild(loadParent);
        header.appendChild(minimiser);
        header.appendChild(loadChild);
        header.appendChild(permalink);
        header.appendChild(author);
        header.appendChild(created);
        header.className = 'comment-header';

        var md = document.createElement('div');
        md.innerHTML = data.body_html;
        md.innerHTML = md.firstChild.nodeValue;
        liveComments.bpm(md);
        md.className = 'md-wrapper';
        md.style.height = 'auto';

        var comment = document.createElement('div');
        comment.appendChild(header);
        comment.appendChild(md);
        comment.className = 'comment';

        return comment;
    }).apply(this);
}

liveComments.Comment.prototype.getCopy = function() {
    var copyNo = -1;
    while (this.timestampTimeouts[++copyNo] !== undefined) ;

    var el = this.element.cloneNode(true),
        header = el.firstChild;
    header.firstChild.onclick = this.fetchParent;
    header.childNodes[1].onclick = this.minimise;
    header.childNodes[2].onclick = this.fetchChild;

    el.id = this.id + '-' + copyNo;
    this.timestampTimeouts[copyNo] = null;
    return el;
}

liveComments.Comment.prototype.removeCopy = function(el) {
    this.hide(el);
    el.parentNode.removeChild(el);

    var copyNo = el.id.split('-', 2)[1];
    this.timestampTimeouts[copyNo] = null;
}

liveComments.Comment.prototype.createSubmission = function() {
    var submission = liveComments.loadedSubmissions[this.submission].getCopy(this.id);
    submission.lastChild.appendChild(this.getCopy());
    return submission;
}

liveComments.Comment.prototype.setTimestamp = function(el) {
    function modDiv(a, b) {return (a-a%b)/b}

    var copyNo = el.id.split('-', 2)[1],
        age = Date.now() - this.created,
        value, unit, waitUnit;
    if (value = modDiv(age, 86400000)) { // assignments intended
        unit = ' day';
        waitUnit = 86400000;
    } else if (value = modDiv(age, 3600000)) {
        unit = ' hour';
        waitUnit = 360000;
    } else if (value = modDiv(age, 60000)) {
        unit = ' minute';
        waitUnit = 60000;
    } else {
        el.firstChild.childNodes[5].firstChild.nodeValue = 'just now';
        this.timestampTimeouts[copyNo] = setTimeout(this.setTimestamp.bind(this,
                                                              el), 60000 - age);
        return;
    }

    el.firstChild.childNodes[5].firstChild.nodeValue = value + unit +
                                              (value === 1 ? '' : 's') + ' ago';
    this.timestampTimeouts[copyNo] = setTimeout(this.setTimestamp.bind(this, el),
                                                    (value + 1)*waitUnit - age);
}

liveComments.Comment.prototype.hide = function(el) {
    var copyNo = el.id.split('-', 2)[1];
    clearTimeout(this.timestampTimeouts[copyNo]);
}

liveComments.Comment.prototype.fetchParent = function(event) {
    liveComments.load(event, function(unload) {
        var lc = liveComments.loadedComments,
            el = event.target.parentNode.parentNode,
            id = el.id.split('-', 1)[0],
            pc = lc[el.parentNode.parentNode.id].parentChain;
        while (pc[pc.length - 1] >= id) pc = lc[pc[pc.length - 1]].parentChain;

        var thisValue = liveComments.loadedComments[el.id.split('-', 1)[0]],
            parentId = pc[pc.indexOf(id) + 1],
            parent = liveComments.loadedComments[parentId];
        if (parentId && !parent) {
            var link = el.firstChild.childNodes[3].href;
            liveComments.getReddit(link.slice(0, link.lastIndexOf('/') + 1) +
                          parentId + '.json?context=8', function(status, data) {
                if (status !== 'success') {
                    var moreButton = document.getElementById('more'),
                        message = status === 'failure' ?
                              'Please check connection' : 'Cannot reach reddit';
                    if (moreButton.className === 'faded-in') {
                        moreButton.firstChild.nodeValue += ' (' + message + ')';
                        moreButton.className = 'error';
                    } else if (!moreButton.classList.contains('error')) {
                        moreButton.firstChild.nodeValue = message;
                        moreButton.className = 'faded-in error';
                    }
                    unload();
                    return;
                }

                var submitter = data[0].data.children[0].data.author;
                if (submitter === '[deleted]') {
                    liveComments.loadedSubmissions[data[0].data.id].makeDeleted();
                }

                var lc = liveComments.loadedComments,
                    comment = data[1].data.children[0].data,
                    parents = [comment.parent_id[1] === '1' ?
                               comment.parent_id.slice(3) : ''];
                do {
                    parents.unshift(comment.id);
                    if (lc[comment.id] && lc[comment.id].parentChain) break; // TODO FIX
                    lc[comment.id] = new liveComments.Comment(comment, submitter);
                } while (comment.replies &&
                        (comment = comment.replies.data.children[0].data).id !== id);
                Array.prototype.push.apply(pc, parents.slice(1));

                moveEls.call(thisValue, el,
                                 liveComments.loadedComments[parentId], unload);
            });
        } else {
            moveEls.call(thisValue, el, parent, unload);
        }

        function moveEls(el, parent, unload) {
            var wrapper = el.parentNode;
            if (parent) {
                var parentEl = parent.getCopy();
                parent.setTimestamp(parentEl);

                parentEl.classList.add('shifted-left');
                wrapper.style.height = wrapper.offsetHeight + 'px';
                wrapper.style.backgroundColor = '#fff';
                wrapper.appendChild(parentEl);
                el.style.position = 'absolute';
                el.offsetHeight; // force reflow

                parentEl.classList.remove('shifted-left');
                el.classList.add('shifted-right'); /* duplicated from below
                                     to fire the transitions simultaneously */

                setTimeout(function() { // allows bpm to fire first
                    var initialHeight = parentEl.offsetHeight;
                    parentEl.style.height = el.offsetHeight + 'px';
                    wrapper.style.height = '';
                    wrapper.style.backgroundColor = '';
                    parentEl.offsetHeight; // force reflow

                    if (parentEl.scrollHeight < parentEl.offsetHeight) {
                        parentEl.style.height = parentEl.scrollHeight + 'px';
                    } else {
                        parentEl.style.height = initialHeight + 'px';
                    }
                }, 0);
            } else {
                var loadChild = document.createElement('button');
                loadChild.className = 'child loader faded-out';
                loadChild.style.float = 'right';
                loadChild.onclick = this.fetchChild;

                var header = wrapper.parentNode.firstChild;
                header.insertBefore(loadChild, header.lastChild);
                loadChild.className = 'child loader faded-in';
            }

            el.style.height = el.offsetHeight + 'px';
            el.offsetHeight; // force reflow
            el.style.height = '0';

            el.classList.add('shifted-right');

            setTimeout(function() {
                thisValue.removeCopy(el);
            }, 1500);

            unload();
        }
    }, false);
}

liveComments.Comment.prototype.minimise = function(event) {
    event.preventDefault();
    var el = event.target;
    el.disabled = true;
    el.classList.toggle('minimiser');

    var md = event.target.parentNode.nextSibling;
    if (el.classList.contains('minimiser')) {
        md.style.height = md.scrollHeight + 'px';
    } else {
        if (md.style.height === 'auto') {
            md.style.height = md.offsetHeight + 'px';
            md.offsetHeight; // forces reflow
        }
        md.style.height = '';
    }

    el.disabled = false;
}

liveComments.Comment.prototype.fetchChild = function(event) {
    var el = this.parentNode.parentNode; // this === event.target

    if (el.classList.contains('submission')) {
        liveComments.load(event, function() {
            event.target.className = 'child loader faded-out';

            var lc = liveComments.loadedComments,
                pc = lc[el.id].parentChain;
            while (pc[pc.length - 1] !== '') pc = lc[pc[pc.length - 1]].parentChain;

            var commentId = pc[pc.length - 2],
                comment = lc[commentId],
                commentEl = comment.getCopy(),
                wrapper = el.lastChild;

            comment.setTimestamp(commentEl);

            if (commentId === el.id) comment.disableChild(commentEl);

            commentEl.classList.add('md-wrapper');
            commentEl.style.height = '0';
            wrapper.appendChild(commentEl);
            commentEl.style.height = commentEl.scrollHeight + 'px';
            setTimeout(function() {
                el.firstChild.removeChild(event.target);
                commentEl.classList.remove('md-wrapper');
            }, 500);
        }, false);
    } else {
        liveComments.load(event, function(unload) {
            var lc = liveComments.loadedComments,
                id = el.id.split('-', 1)[0],
                rootId = el.parentNode.parentNode.id,
                pc = lc[rootId].parentChain;
            while (pc[pc.length - 1] > id) pc = lc[pc[pc.length - 1]].parentChain;

            var childId = pc[pc.indexOf(id) - 1],
                child = liveComments.loadedComments[childId],
                childEl = child.getCopy(),
                wrapper = el.parentNode;

            child.setTimestamp(childEl);

            if (childId === rootId) child.disableChild(childEl);

            childEl.classList.add('shifted-right');
            wrapper.style.height = wrapper.offsetHeight + 'px';
            wrapper.style.backgroundColor = '#fff';
            el.style.position = 'absolute';
            wrapper.appendChild(childEl);

            el.style.height = el.offsetHeight + 'px';
            el.offsetHeight; // force reflow
            el.style.height = '0';

            el.classList.add('shifted-left');
            childEl.classList.remove('shifted-right'); /* duplicated from below
                                         to fire the transitions simultaneously */

            setTimeout(function() { // allows bpm to fire first
                var initialHeight = childEl.offsetHeight;
                childEl.style.height = el.offsetHeight + 'px';
                wrapper.style.height = '';
                wrapper.style.backgroundColor = '';
                childEl.offsetHeight; // force reflow

                if (childEl.scrollHeight < childEl.offsetHeight) {
                    childEl.style.height = childEl.scrollHeight + 'px';
                } else {
                    childEl.style.height = initialHeight + 'px';
                }

                setTimeout(function() {
                    liveComments.loadedComments[el.id.split('-',
                                                          1)[0]].removeCopy(el);
                }, 1500);
            }, 0);
        });
    }
}

liveComments.Comment.prototype.disableChild = function(el) {
    var loadChild = el.firstChild.childNodes[2];
    loadChild.className = 'unloadable';
    loadChild.onclick = null;
}