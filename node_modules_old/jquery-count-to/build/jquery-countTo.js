
/*
 * - options -
 * decimals: number of decimal places to the right to display
 * duration: duration in seconds of the count animation
 * max_steps/min_steps: max/min steps that occur during animation
 */

(function() {
  $.fn.countTo = function(target, options) {
    if (options == null) {
      options = {};
    }
    return $(this).each(function() {
      var $this, current, data, diff, num_steps, step, step_duration, step_size;
      $this = $(this);
      if (options.decimals == null) {
        options.decimals = 0;
      }
      if (options.duration == null) {
        options.duration = 1;
      }
      if (options.max_steps == null) {
        options.max_steps = 100;
      }
      if (options.min_steps == null) {
        options.min_steps = 1;
      }
      current = ($this.text() || '').replace(/,/g, '');
      current = parseFloat(current, 10) || 0;
      target = parseFloat(target, 10) || current;
      diff = target - current;
      num_steps = Math.abs(Math.round(diff));
      num_steps = Math.max(num_steps, options.min_steps);
      num_steps = Math.min(num_steps, options.max_steps);
      num_steps = Math.min(num_steps, options.max_steps * options.duration);
      step_size = diff / num_steps;
      step_duration = 1000 * options.duration / num_steps;
      data = $this.data('countTo') || {};
      $this.data('countTo', data);
      if (data.interval) {
        clearInterval(data.interval);
      }
      step = 0;
      return data.interval = setInterval((function() {
        var parts, value;
        value = current + step * step_size || 0;
        value = value.toFixed(options.decimals);
        parts = value.toString().split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        value = parts.join('.');
        $this.text(value);
        if (++step > num_steps) {
          $this.removeData('countTo');
          clearInterval(data.interval);
          return typeof options.done === "function" ? options.done() : void 0;
        }
      }), step_duration);
    });
  };

}).call(this);
