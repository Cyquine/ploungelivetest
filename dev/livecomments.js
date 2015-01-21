'use strict';
window.liveComments = {
    loadedComments: {},
    loadedSubmissions: {},
    lastCall: 0,
    nextCallTimeout: null,
    queries: {},
    getReddit: function(url, callback) {
        clearTimeout(liveComments.nextCallTimeout);

        var delay;
        if ((delay = Date.now() - liveComments.lastCall - 2000) < 0) {
            setTimeout(liveComments.getReddit, delay, url, callback);
        } else {
            var request = new XMLHttpRequest();
            
            request.onload = function() {
                liveComments.lastCall = Date.now();
                if (request.status >= 200 && request.status < 400) {
                    liveComments.nextCallTimeout =
                                     setTimeout(liveComments.getComments, 2000);
                    callback(JSON.parse(request.response));
                    return 0;
                } else {
                    liveComments.nextCallTimeout =
                       setTimeout(liveComments.getReddit.bind(null, url), 2000);
                    return 1;
                }
            }

            request.onerror = function() {
                liveComments.nextCallTimeout =
                       setTimeout(liveComments.getReddit.bind(null, url), 2000);
                return 2;
            };

            request.open('GET', url);
            request.send();
        }
    },
    getComments: function () {
        var params = liveComments.getComments.params,
            paramArray = [];
        for (var p in params) {
            paramArray.push(p + '=' + params[p]);
        }

        liveComments.getReddit('https://www.reddit.com/r/' + liveComments.queries.subreddit +
                  '/comments.json?' + paramArray.join('&'), function(data) {
            if (data.data.children.length === 0) return;

            var list = liveComments.listComments;

            for (var lc = liveComments.loadedComments,
                     ls = liveComments.loadedSubmissions,
                     comments = data.data.children,
                     i = comments.length - 1; i >= 0; i--) {
                var comment = comments[i].data;
                if (!lc[comment.id]) {
                    lc[comment.id] = new liveComments.Comment(comment);
                    list.comments.unshift(comment.id);

                    var link_id = comment.link_id.slice(3);
                    if (!ls[link_id]) {
                        ls[link_id] = new liveComments.Submission(comment);
                    }
                }
            }

            var nc = list.comments.length; // new comments
            if (nc === 0) return;

            if (params.before === '') {
                list();
            } else {
                var moreButton = document.getElementById('more');
                moreButton.className = 'faded-in';

                var message = nc + ' new comment' + (nc === 1 ? '' : 's');
                moreButton.firstChild.nodeValue = message;

                document.title = message + ': ' + liveComments.queries.subreddit;
            }
            params.before = 't1_' + list.comments[0];
        });
    },
    load: function(event, handler) {
        event.preventDefault();
        var el = event.target;
        el.disabled = true;

        var loadingSegs = document.createElement('span');
        loadingSegs.className = 'loading-segs';
        el.appendChild(loadingSegs);
        el.classList.add('loading');

        handler();

        el.classList.remove('loading');
        el.removeChild(loadingSegs);
        el.disabled = false;
    },
    listComments: function() {
        var comments = liveComments.listComments.comments;
        liveComments.listComments.comments = [];

        document.getElementById('more').className = 'faded-out';
        document.title = 'comments: ' + liveComments.queries.subreddit;

        var wrapper = document.createDocumentFragment();
        for (var i = 0; i < comments.length; i++) {
            var comment = liveComments.loadedComments[comments[i]];
            var el = comment.createSubmission();
            wrapper.appendChild(el);
            comment.show(el.lastChild.lastChild);
        }

        for (var n = Math.min(comments.length, 3), i = 0; i < n; i++) {
            var el = wrapper.childNodes[i];
            el.className = 'submission faded-out';
            setTimeout((function() {
                this.className = 'submission faded-in';
            }).bind(el), 100*(n - i));
        }

        var listing = document.getElementById('content');
        listing.insertBefore(wrapper, listing.firstChild);

        var hideButton = document.getElementById('hide');
        hideButton.textContent = 'Hide ' + Math.min(listing.children.length, 25);
        hideButton.className = 'faded-in';
    },
    showComments: function() {
        var comments = liveComments.showComments.comments,
            lc = liveComments.loadedComments,
            wrapper = document.getElementById('content');
        for (var toHide = Math.min(comments.length, 25),
                 i = 0; i < toHide; i++) {
            var submission = comments.shift();
            wrapper.appendChild(submission);

            var comment = submission.lastChild.lastChild;
            if (comment) {
                var id = comment.id.split('-', 1)[0];
                lc[id].show(comment);
            }
        }

        var showButton = document.getElementById('show'),
            hiddenComments = document.getElementById('hidden-comments'),
            hidden = comments.length;
        if (hidden === 0) {
            showButton.className = 'faded-out';
            hiddenComments.firstChild.nodeValue = 'No hidden comments';
        } else {
            showButton.firstChild.nodeValue = 'Show ' + Math.min(hidden, 25);
            hiddenComments.firstChild.nodeValue = hidden + ' hidden comment' +
                                                        (hidden > 1 ? 's' : '');
        }

        var hideButton = document.getElementById('hide');
        hideButton.firstChild.nodeValue = 'Hide ' + Math.min(wrapper.children.length, 25);
        hideButton.className = 'faded-in';
    },
    hideComments: function() {
        var comments = liveComments.showComments.comments,
            lc = liveComments.loadedComments,
            wrapper = document.getElementById('content');
        for (var toHide = Math.min(wrapper.children.length, 25),
                 i = 0; i < toHide; i++) {
            var submission = wrapper.lastChild;
            wrapper.removeChild(submission);
            comments.unshift(submission);

            var comment = submission.lastChild.lastChild;
            if (comment) {
                var id = comment.id.split('-', 1)[0];
                lc[id].hide(comment);
            }
        }

        var showButton = document.getElementById('show'),
            hideButton = document.getElementById('hide'),
            hidden = comments.length;

        showButton.firstChild.nodeValue = 'Show ' + Math.min(hidden, 25);
        showButton.className = 'faded-in';

        if (wrapper.children.length === 0) hideButton.className = 'faded-out';
        else hideButton.firstChild.nodeValue = 'Hide ' +
                                          Math.min(wrapper.children.length, 25);

        document.getElementById('hidden-comments').firstChild.nodeValue =
                           hidden + ' hidden comment' + (hidden > 1 ? 's' : '');
    }
};
liveComments.listComments.comments = [];
liveComments.showComments.comments = [];
document.addEventListener('DOMContentLoaded', function() {
    var moreButton = document.getElementById('more');
    moreButton.firstChild.nodeValue = 'Loading...';
    moreButton.onclick = liveComments.listComments;

    document.getElementById('show').onclick = liveComments.showComments;
    document.getElementById('hide').onclick = liveComments.hideComments;
    document.getElementById('content').style.paddingBottom = 
                 document.getElementById('hidden-comments').offsetHeight + 'px';

    var queries = liveComments.queries;
    for (var queryString = location.search.slice(1).split('&'), i = 0;
            i < queryString.length; i++) {
        var pair = queryString[i].split('=');
        queries[pair[0]] = pair[1];
    }
    queries.subreddit = queries.subreddit || 'MLPLounge';
    document.title = 'comments: ' + queries.subreddit;

    liveComments.getComments.params = {'before': ''};
    if (queries.limit) liveComments.getComments.params.limit = queries.limit;
    liveComments.getComments();
});