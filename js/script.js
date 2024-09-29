$(document).ready(function() {
    var config = {
        uptimerobot: {
            api_keys: [
                // apmpproject.org
                'm780974685-7d19825af3dbce1aa43364eb',
                // casjay.email
                'm780974654-51233d5f068d3500b4446093',
                // casjay.in
                'm780974706-a81fb0e11c811599dfcf8b9e',
                // casjay.info
                'm797732116-786986371aae591637b73e2b',
                // casjay.pro
                'm780974598-6165aacfbf6f2113c317beed',
                // casjaydns.com
                'm780974652-031d256860cb3b82d7af169f',
                // casjaydns.fyi
                'm797732139-c76eb37ab6f16b2c02261144',
                // casjaysdev.pro
                'm780974701-c09198d02b91e0f091e6ce90',
                // casjay.cc
                'm797732127-0fcd44d845f1f9cfb212bd3e',
                // casjay.coffee
                'm797732131-13cca6831b6711d2201210e7',
                // casjay.link
                'm797732134-5fed07686004281de4337425',
                // casjay.org
                'm797732136-cede1f25356c0cc38d9b4f29',
                // casjay.work
                'm797732137-68d5fb398099c1b6a70d291b',
                // casjay.xyz
                'm797732138-6ab8c4585692fce86315dea1',
                // csj.lol
                'm797732142-2bfec105ecf7f8d25fb9d39e',
                // dockersrc.us
                'm797732147-346522494f5b9cd540c8c230',
                // malaks.us
                'm797732151-12d451565cb80ddf940db4df',
                // sqldb.us
                'm797732155-9413acf3a85c62d2a2282d03',
                // cloud.casjay.pro
                'm797755074-c2f85d66c60a8d5d09c7d846',
                // dns1.casjaydns.com
                'm797732239-ecb64818d5f885258699e49e',
                // dns2.casjaydns.com
                'm797732243-578a2cdf2c817a904c303fca',
                // gist.casjay.work
                'm797732217-be258089a9db66008e12ae5c',
                //
                '',
            ],
            logs: 1
        },
        github: {
            org: 'casjaysdev',
            repo: 'status.casjaysdev.pro'
        }
    };

    var status_text = {
        'operational': 'operational',
        'investigating': 'investigating',
        'major outage': 'outage',
        'degraded performance': 'degraded',
    };

    var monitors = config.uptimerobot.api_keys;
    for( var i in monitors ){
        var api_key = monitors[i];
        $.post('https://api.uptimerobot.com/v2/getMonitors', {
            "api_key": api_key,
            "format": "json",
            "logs": config.uptimerobot.logs,
            "custom_http_headers": "1",
        }, function(response) {
            status( response );
        }, 'json');
    }

    function status(data) {
        data.monitors = data.monitors.map(function(check) {
            check.class = check.status === 2 ? 'label-success' : 'label-danger';
            check.text = check.status === 2 ? 'operational' : 'major outage';
            if( check.status !== 2 && !check.lasterrortime ){
                check.lasterrortime = Date.now();
            }
            if (check.status === 2 && Date.now() - (check.lasterrortime * 1000) <= 86400000) {
                check.class = 'label-warning';
                check.text = 'degraded performance';
            }
            return check;
        });

        var status = data.monitors.reduce(function(status, check) {
            return check.status !== 2 ? 'danger' : 'operational';
        }, 'operational');

        if (!$('#panel').data('incident')) {
            $('#panel').attr('class', (status === 'operational' ? 'panel-success' : 'panel-warning') );
            $('#paneltitle').html(status === 'operational' ? 'All systems are operational.' : 'One or more systems inoperative');
        }
        data.monitors.forEach(function(item) {
            var name = item.friendly_name;
            var clas = item.class;
            var text = item.text;
            $('#services').append('<div class="list-group-item">'+
                '<span class="badge '+ clas + '">' + text + '</span>' +
                '<h4 class="list-group-item-heading">' + name + '</h4>' +
                '</div>');
        });
    };

    $.getJSON( 'https://api.github.com/repos/' + config.github.org + '/' + config.github.repo + '/issues?state=all' ).done(message);

    function message(issues) {
        issues.forEach(function(issue) {
            var status = issue.labels.reduce(function(status, label) {
                if (/^status:/.test(label.name)) {
                    return label.name.replace('status:', '');
                } else {
                    return status;
                }
            }, 'operational');

            var systems = issue.labels.filter(function(label) {
                return /^system:/.test(label.name);
            }).map(function(label) {
                return label.name.replace('system:', '')
            });

            if (issue.state === 'open') {
                $('#panel').data('incident', 'true');
                $('#panel').attr('class', (status === 'operational' ? 'panel-success' : 'panel-warn') );
                $('#paneltitle').html('<a href="#incidents">' + issue.title + '</a>');
            }

            var html = '<article class="timeline-entry">\n';
            html += '<div class="timeline-entry-inner">\n';

            if (issue.state === 'closed') {
                html += '<div class="timeline-icon bg-success"><i class="entypo-feather"></i></div>';
            } else {
                html += '<div class="timeline-icon bg-secondary"><i class="entypo-feather"></i></div>';
            }

            html += '<div class="timeline-label">\n';
            html += '<span class="date">' + datetime(issue.created_at) + '</span>\n';

            if (issue.state === 'closed') {
                html += '<span class="badge label-success pull-right">closed</span>';
            } else {
                html += '<span class="badge ' + (status === 'operational' ? 'label-success' : 'label-warn') + ' pull-right">open</span>\n';
            }

            for (var i = 0; i < systems.length; i++) {
                html += '<span class="badge system pull-right">' + systems[i] + '</span>';
            }

            html += '<h2>' + issue.title + '</h2>\n';
            html += '<hr>\n';
            html += '<p>' + issue.body + '</p>\n';

            if (issue.state === 'closed') {
                html += '<p><em>Updated ' + datetime(issue.closed_at) + '<br/>';
                html += 'The system is back in normal operation.</p>';
            }
            html += '</div>';
            html += '</div>';
            html += '</article>';
            $('#incidents').append(html);
        });

        function datetime(string) {
            var datetime = string.split('T');
            var date = datetime[0];
            var time = datetime[1].replace('Z', '');
            return date + ' ' + time;
        };
    };
});
