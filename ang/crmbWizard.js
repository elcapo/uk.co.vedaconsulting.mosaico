(function(angular, $, _) {
  // Declare a list of dependencies.
  angular.module('crmbWizard', [
    'crmUi', 'crmUtil'
  ]);


  // example: <div crmb-wizard-bootstrap="myWizardCtrl"><div crmb-wizard-bootstrap-step crm-title="ts('Step 1')">...</div><div crmb-wizard-bootstrap-step crm-title="ts('Step 2')">...</div></div>
  // example with custom nav classes: <div crmb-wizard-bootstrap crmb-wizard-bootstrap-nav-class="ng-animate-out ...">...</div>
  // Note: "myWizardCtrl" has various actions/properties like next() and $first().
  // WISHLIST: Allow each step to determine if it is "complete" / "valid" / "selectable"
  // WISHLIST: Allow each step to enable/disable (show/hide) itself
  angular.module('crmbWizard').directive('crmbWizard', function() {
      return {
        restrict: 'EA',
        scope: {
          crmbWizard: '@',
          crmbWizardCtrl: '=',
          crmbWizardNavClass: '@' // string, A list of classes that will be added to the nav items
        },
        templateUrl: '~/crmbWizard/layout.html',
        transclude: true,
        controllerAs: 'crmbWizardCtrl',
        controller: function($scope, $parse) {
          var steps = $scope.steps = []; // array<$scope>
          var crmbWizardCtrl = this;
          var maxVisited = 0;
          var selectedIndex = null;

          var findIndex = function() {
            var found = null;
            angular.forEach(steps, function(step, stepKey) {
              if (step.selected) found = stepKey;
            });
            return found;
          };

          /// @return int the index of the current step
          this.$index = function() { return selectedIndex; };
          /// @return bool whether the currentstep is first
          this.$first = function() { return this.$index() === 0; };
          /// @return bool whether the current step is last
          this.$last = function() { return this.$index() === steps.length -1; };
          this.$maxVisit = function() { return maxVisited; };
          this.$validStep = function() {
            return steps[selectedIndex] && steps[selectedIndex].isStepValid();
          };
          this.iconFor = function(index) {
            if (index < this.$index()) return '√';
            if (index === this.$index()) return '»';
            return ' ';
          };
          this.isSelectable = function(step) {
            if (step.selected) return false;
            var result = false;
            angular.forEach(steps, function(otherStep, otherKey) {
              if (step === otherStep && otherKey <= maxVisited) result = true;
            });
            return result;
          };

          /*** @param Object step the $scope of the step */
          this.select = function(step) {
            angular.forEach(steps, function(otherStep, otherKey) {
              otherStep.selected = (otherStep === step);
              if (otherStep === step && maxVisited < otherKey) maxVisited = otherKey;
            });
            selectedIndex = findIndex();
          };
          /*** @param Object step the $scope of the step */
          this.add = function(step) {
            if (steps.length === 0) {
              step.selected = true;
              selectedIndex = 0;
            }
            steps.push(step);
            steps.sort(function(a,b){
              return a.crmbWizardStep - b.crmbWizardStep;
            });
            selectedIndex = findIndex();
          };
          this.remove = function(step) {
            var key = null;
            angular.forEach(steps, function(otherStep, otherKey) {
              if (otherStep === step) key = otherKey;
            });
            if (key !== null) {
              steps.splice(key, 1);
            }
          };
          this.goto = function(index) {
            if (index < 0) index = 0;
            if (index >= steps.length) index = steps.length-1;
            this.select(steps[index]);
          };
          this.previous = function() { this.goto(this.$index()-1); };
          this.next = function() { this.goto(this.$index()+1); };
          if ($scope.crmbWizard) {
            $parse($scope.crmbWizard).assign($scope.$parent, this);
          }

          $scope.crmbWizardCtrl = this;
        },
        link: function (scope, element, attrs) {
          scope.ts = CRM.ts(null);
        }
      };
    });

  // Use this to add extra markup to wizard
  angular.module('crmbWizard').directive('crmbWizardButtonPosition', function() {
    return {
      require: '^crmbWizard',
      restrict: 'EA',
      scope: {
        crmbWizardButtonPosition: '@'
      },
      template: '<span ng-transclude></span>',
      transclude: true,
      link: function (scope, element, attrs, crmbWizardCtrl) {
        var pos = scope.crmbWizardButtonPosition;
        var realButtonsEl = $(element).closest('.crmb-wizard').find('.crmb-wizard-button-' + pos);
        if (pos === 'right') realButtonsEl.append(' ');
        element.appendTo(realButtonsEl);
        if (pos === 'left') realButtonsEl.append(' ');
      }
    };
  });


  // example: <div crmb-wizard-bootstrap-step crm-title="ts('My Title')" ng-form="mySubForm">...content...</div>
  // If there are any conditional steps, then be sure to set a weight explicitly on *all* steps to maintain ordering.
  // example: <div crmb-wizard-bootstrap-step="100" crm-title="..." ng-if="...">...content...</div>
  // example with custom classes: <div crmb-wizard-bootstrap-step="100" crmb-wizard-bootstrap-step-class="ng-animate-out ...">...content...</div>
  angular.module('crmbWizard').directive('crmbWizardStep', function() {
    var nextWeight = 1;
    return {
      require: ['^crmbWizard', 'form'],
      restrict: 'EA',
      scope: {
        crmTitle: '@', // expression, evaluates to a printable string
        crmbWizardStep: '@', // int, a weight which determines the ordering of the steps
        crmbWizardStepClass: '@' // string, A list of classes that will be added to the template
      },
      template: '<div class="crmb-wizard-step {{crmbWizardStepClass}}" ng-show="selected" ng-transclude/></div>',
      transclude: true,
      link: function (scope, element, attrs, ctrls) {
        var crmbWizardCtrl = ctrls[0], form = ctrls[1];
        if (scope.crmbWizardStep) {
          scope.crmbWizardStep = parseInt(scope.crmbWizardStep);
        } else {
          scope.crmbWizardStep = nextWeight++;
        }
        scope.isStepValid = function() {
          return form.$valid;
        };
        crmbWizardCtrl.add(scope);
        scope.$on('$destroy', function(){
          crmbWizardCtrl.remove(scope);
        });
      }
    };
  })


})(angular, CRM.$, CRM._);
