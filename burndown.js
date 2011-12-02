function run(){
	//grab the input from the textfield, making sure it's not null etc.
	var url = document.getElementById('repo').value;
	url = validate(url)
	
	//if (!url){
	//	document.getElementById('repo').value = ''; //<- That's not something nice
	//	return;
	//}

	//let's get the issues from the repo.
	var issues = getIssues(url);

	//now that we have the data, let's run through it and look for lines that look like
	// !! hoursNeeded: 5
	// !! hoursSpent: 8
	//and add the hours to hours
	var hours = gatherHours(issues);
	//console.log(hours)
	
	getNextDeadline(url);

	//now we've got total time spent so far, and total projected time needed.
	//let's massage this a little and push it up to the google charts API.
	viz(hours[0], hours[1]);


	//done? done.
}

function validate(url){
	
	//super-fun regex to validate url
	var regex = function(url){
		
		return true;
	}
	if (!regex(url)) return false;
}

function getIssues(url){
	//send a get request to github's API, parse them into an array of objects.

	//massage the url to make an api callable url first
	url = 'https://api.github.com/repos/CarlQLange/Github-Burndown-Charts/issues'

	var request = new XMLHttpRequest();
	request.open('GET', url, false);   
	request.send(null);

	return request.response;
}

function getMilestones(url){
	url = 'https://api.github.com/repos/CarlQLange/Github-Burndown-Charts/milestones'

	var request = new XMLHttpRequest();  
	request.open('GET', url, false);   
	request.send(null);

	return request.response;
}

function scan(issue){
	//match a regex of "!!hoursNeeded:somenumber" and "!!hoursSpent:somenumber"
	var needed = ( issue.body.match(/(!{2}hoursNeeded:\d+)/) )
	var spent = ( issue.body.match(/(!{2}hoursSpent:\d+)/) )

	if ((needed == null) && (spent == null)){
		return [0,0];
	}

	//now grab the numbers:
	needed = parseInt((needed[0].match(/\d+/)[0]))
	spent = parseInt((spent[0].match(/\d+/)[0]))

	return [needed,spent];
}

function gatherHours(issues){
	var hoursNeeded = 0;
	var hoursSpent = 0;
	var hrs; //because loops don't have scope in js
	var issues = JSON.parse(issues)
	for (issue in issues){
		hrs = scan(issues[issue]);
		hoursSpent += hrs[0];
		hoursNeeded += hrs[1];
	}

	return [hoursSpent, hoursNeeded];
}

function getNextDeadline(url){
	var milestones = JSON.parse(getMilestones(url));
	var deadlines = []
	for (milestone in milestones){
		deadlines.push(new Date(milestones[milestone].due_on))
	}

	//get closest date
	var closest;
	for (date in deadlines){
		if (!closest){
			closest = deadlines[date]
			continue	
		} 
		if (deadlines[date] < closest){ //sweet, I didn't know if this would work
			closest = deadlines[date]
		}
	}

	return closest;
}

function viz(hoursNeeded, hoursSpent){
	var data = new google.visualization.DataTable();

    var daysBeforeDeadline = [
    	new Date("Dec 02 2011"),
    	new Date("Dec 03 2011"),
    	new Date("Dec 04 2011"),
    	new Date("Dec 05 2011"),
    	new Date("Dec 06 2011")
    ]
    console.log(daysBeforeDeadline)
    data.addColumn('string', 'date')
    data.addColumn('number', 'ideal')
    data.addColumn('number', 'real')

    data.addRows(daysBeforeDeadline.length)

    for (day in daysBeforeDeadline){
    	data.setValue(parseInt(day), 0, daysBeforeDeadline[day].toDateString())

    	data.setValue(parseInt(day), 1, (hoursNeeded+1) - daysBeforeDeadline.length-day)

    	
    }

    //data.setValue(0, 2, 12);
	//data.setValue(1, 2, 6);
	//data.setValue(2, 2, 4);

    var chart = new google.visualization.LineChart(document.getElementById('chart'));
    chart.draw(data, {width: 500, height: 500, title: 'Burndown Chart'});
}