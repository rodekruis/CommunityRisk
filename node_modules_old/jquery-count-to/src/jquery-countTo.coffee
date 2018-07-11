###
# - options -
# decimals: number of decimal places to the right to display
# duration: duration in seconds of the count animation
# max_steps/min_steps: max/min steps that occur during animation
###

$.fn.countTo = (target, options = {}) ->

  # allow tweening multiple elements
  $(this).each ->
    $this = $(this)

    # defaults
    options.decimals ?= 0
    options.duration ?= 1
    options.max_steps ?= 100
    options.min_steps ?= 1

    # get values and the difference between them
    current = ($this.text() or '').replace /,/g, ''
    current = parseFloat(current, 10) or 0
    target = parseFloat(target, 10) or current
    diff = target - current

    # figure out how many steps we'll do in our tween
    num_steps = Math.abs Math.round diff
    num_steps = Math.max num_steps, options.min_steps
    num_steps = Math.min num_steps, options.max_steps
    num_steps = Math.min num_steps, options.max_steps * options.duration

    # calculate step size and step duration
    step_size = diff / num_steps
    step_duration = 1000 * options.duration / num_steps

    # store the timeout interval on the element in case countTo is called again
    data = $this.data('countTo') or {}
    $this.data 'countTo', data
    clearInterval data.interval if data.interval

    # animate
    step = 0
    data.interval = setInterval ( ->
      value = current + step * step_size or 0
      value = value.toFixed options.decimals
      parts = value.toString().split '.'
      parts[0] = parts[0].replace /\B(?=(\d{3})+(?!\d))/g, ','
      value = parts.join '.'
      $this.text value
      if ++step > num_steps
        $this.removeData 'countTo'
        clearInterval data.interval
        options.done?()
    ), step_duration
