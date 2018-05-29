function(instance, properties, context) {

  //quick check to see if data is ready
  if (properties.date === null || properties.end_date === null || properties.start_date === null) {
    console.log("null");
    return;
  }
 


  //set some variables up
  var future_dates = [];
  var cronExp = new CronBuilder();
  var daysIndex = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  var allDates = [], newDates = [];  
  var timeUnit;



  
  
  /************
  ** Sorts dates in ascending order
  **
  */
  var sortDates = function sortDates(date1, date2) {
    if (date1 < date2) return -1;
    if (date1 > date2) return 1;
    return 0;
  };

  
  /************
  ** Adds a load of dates between a start and end date that map to the time unit and interval rules
  **
  */
  function addDates(start,end,timeUnit,interval) {
    //console.log('Start: '+start.toDate()+' ** End: '+end.toDate());
    
    if (start > end) return;

    var newDate = [];
    var tempCurrent = start.clone(); 
       
    for (var x = 1;tempCurrent <= end;x++) {
      var multiplier = x;
      tempCurrent = start.clone().add(multiplier*interval, timeUnit);
      var oldDate = tempCurrent.toDate();
      if (tempCurrent > end) break;
      newDate[x] = oldDate;
    }
    return newDate;

  }

  
 

  /************
  ** For yearly reminders, works out what the next date is for the action
  **
  */
  function findMultipleDays(dayIndex, start){
    var temp = start;
    // if we haven't yet passed the day of the week that I need:
    if (temp.isoWeekday() <= dayIndex) { 
      // then just give me this week's instance of that day
      return temp.isoWeekday(dayIndex);
    } else {
      // otherwise, give me next week's instance of that day
      return temp.clone().add(1, 'weeks').isoWeekday(dayIndex);
    }
  }

    

  /************
  ** Creates initial Cron expression from a given date
  **
  */
  function createCronExpStart(date){
    var cronExpStart = new CronBuilder();  
    cronExpStart.addValue('minute', minute.toString());
    cronExpStart.addValue('hour', hour.toString());
    cronExpStart.addValue('dayOfTheMonth', dateOfMonth.toString());
	  cronExpStart.addValue('month', monthOfYear.toString());
    return cronExpStart.build();
  }

  
  
  //get properties

  var startDate = moment(properties.start_date);
  var endDate = moment(properties.end_date);
  if (properties.interval === null) var interval = 1;
  else var interval = properties.interval
  var days = properties.days_of_week.get(0,properties.days_of_week.length());
  var minute = startDate.minute();
  var hour = startDate.hour();
  var dayOfWeek = startDate.day();
  var dateOfMonth = startDate.date();
  var monthOfYear = startDate.month()+1;


  switch(properties.repeat) {

    case "Daily":
		  timeUnit='days';
      newDates = addDates(startDate,endDate,timeUnit,interval);
      
      if (interval === 1){
        var cronExp = new CronBuilder();
        cronExp.addValue('minute', minute.toString());
        cronExp.addValue('hour', hour.toString());
        cronExp.addValue('dayOfTheWeek', '*');
        cronExp = cronExp.build();
        //instance.publishState("cron_expression_repeat",cronExp.build());
      }
      else {
        var cronExp = minute.toString()+' '+hour.toString()+' '+'*/'+interval+' * *';       
      }
      
      break;
      
    case "Weekly":
		  timeUnit='weeks';
      newDates = addDates(startDate,endDate,timeUnit,interval);

      if (interval === 1){
        var cronExp = new CronBuilder();
        cronExp.addValue('minute', minute.toString());
        cronExp.addValue('hour', hour.toString());
        cronExp.addValue('dayOfTheWeek', dayOfWeek.toString());
        cronExp = cronExp.build();
      }
      else {
        var weekInterval = 7*interval;
        var cronExp = minute.toString()+' '+hour.toString()+' '+'*/'+weekInterval+' * '+dayOfWeek.toString();       
      }
      break;
      
    case "Monthly":
		  timeUnit='months';
      newDates = addDates(startDate,endDate,timeUnit,interval);
      
      if (interval === 1){
        var cronExp = new CronBuilder();
        cronExp.addValue('minute', minute.toString());
        cronExp.addValue('hour', hour.toString());
        cronExp.addValue('dayOfTheMonth', dateOfMonth.toString());
        cronExp = cronExp.build();
      }
      else {
        var cronExp = minute.toString()+' '+hour.toString()+' '+dateOfMonth.toString()+' '+'*/'+interval+' *';
      }
      break;
      
    case "Annually":
      timeUnit='years';
      newDates = addDates(startDate,endDate,timeUnit,interval);

      if (interval === 1){      
        var cronExp = new CronBuilder();
        cronExp.addValue('minute', minute.toString());
        cronExp.addValue('hour', hour.toString());
        cronExp.addValue('dayOfTheMonth', dateOfMonth.toString());
        cronExp.addValue('month', monthOfYear.toString());   
        cronExp = cronExp.build();
      }
      else {
        var cronExp = minute.toString()+' '+hour.toString()+' '+dateOfMonth.toString()+' '+monthOfYear.toString()+' '+'*/'+interval;
      }      
      break;
      
    case "Day(s) of Week":
		  timeUnit='weeks';
      var daysRef = [];
      for (var day in days) {       
         daysRef[day]=daysIndex.indexOf(days[day])+1;
         days[day]=findMultipleDays(daysIndex.indexOf(days[day])+1,startDate);
         newDates = newDates.concat(addDates(days[day],endDate,timeUnit,1));
       }
      newDates.sort(sortDates);

      cronExp.addValue('minute', minute.toString());
    	cronExp.addValue('hour', hour.toString());
      var index = daysRef.indexOf(7);
      if (index !== -1) {
        daysRef[index] = 0;
      }
    	cronExp.addValue('dayOfTheWeek', daysRef.toString());
      cronExp = cronExp.build();
      break;
      
    case "Never":
        /*cronExp.addValue('minute', minute.toString());
        cronExp.addValue('hour', hour.toString());
        cronExp.addValue('dayOfTheMonth', dateOfMonth.toString());
        cronExp.addValue('month', monthOfYear.toString());     	*/
        break;
    default:
      	break;
}

  
  
  
/* Can use this if action needs to set a Cron call for the Investment Plan due date too
  if (newDates[newDates.length - 1] !== endDate) {
  	Space to create final Cron call if needed
  	newDates.push(endDate.clone());
  }
  */
  
  
  
  
  newDates[0] = startDate.clone().toDate();
  
  instance.publishState("cron_expression_start",createCronExpStart(startDate));

  instance.publishState("future_dates",newDates);

  if (newDates.length > 1) instance.publishState("cron_expression_repeat",cronExp);
  else instance.publishState("cron_expression_repeat",null);

  
  

  



}