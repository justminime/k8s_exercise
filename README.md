# k8s_exercise

## Build small API programs that connect to db

1. I copied a small node js program for users and shifts.
2. wrapped it by Dockerfile
3. build user-api docker image
    ```bash
    cd user-api
    docker build -t myregistry/user-api:latest .
    ```
4. build shift-api docker -mage
    ```bash
    cd shift-api
    docker build -t myregistry/shift-api:latest .
    ```

## 1.) We want to deploy two containers that scale independently from one another.
1. deploy user-api
This container runs 2 replicas pod of a small API that returns users from a database. and 1 isolated users mongodb.

    ```bash
    kubectl apply -f user-deployment.yaml
    ```

2. deploy shift-api
This container runs 3 replicas pod of a small API that returns users from a database. and 1 isolated shifts mongodb

    ```bash
    kubectl apply -f shift-deployment.yaml
    ```


## 2.) For the best user experience auto scale this service when the average CPU reaches 70%.

1.  add resources limit in order to calculate the 70%

```yaml
          resources:
            requests:
              cpu: 50m
              memory: 128Mi
            limits:
              cpu: 200m
              memory: 512Mi
```

2. add the HPA (Horizontal Pod Autoscaler)

This allows minimum of 2 replicas an max of 10. meaning every time a pod get's to 70 percent cpu another one will be added till the amount of 10.

```yaml
apiVersion: autoscaling/v2beta1
kind: HorizontalPodAutoscaler
metadata:
  name: users-api-autoscaler
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: users-api
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

## 3.) Ensure the deployment can handle rolling deployments and rollbacks.

I've added this to deployment:
allow a rolling update procedure which replace one by one so only one unavailable pod on rollout and always have at least one running.

```yaml
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  minReadySeconds: 30
```

user can rollout by running
```bash
kubectl rollout restart deployment/users-api
```
and rollback by running (will return to previous version)

```bash
kubectl rollout undo deployment/shifts-api
```
## 4.) Your development team should not be able to run certain commands on your k8s cluster, but you want them to be able to deploy and roll back. What types of IAM controls do you put in place?

I used RBAC (Role-based access control) solution

created deployer role

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: deployer
rules:
- apiGroups: ["apps", "extensions"]
  resources: ["deployments"]
  verbs: ["create", "get", "update", "patch", "delete", "rollback"]
```

and added the role to specific user

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: deployer-binding
subjects:
- kind: User
  name: john@example.com
roleRef:
  kind: Role
  name: deployer
  apiGroup: rbac.authorization.k8s.io
```


## Bonus: How would you apply the configs to multiple environments (staging vs production)?
By using Helm charts I can apply deferent variables to different environments. (Helm Folder)

Build Helm with replicas in values 2
```bash
cd helm
helm package .
```

Deploy 2 replicas using helm
```bash
helm install users-api users-api-1.0.0.tgz 
```

Deploying with production variable meaning 5 replicas
```bash
helm upgrade users-api ./ --values ../values-prod.yaml 
```
## Bonus: How would you auto-scale the deployment based on network latency instead of CPU?
In order to do this I need to create the custom metric 'network_latency" by using a third service like Prometheus.
the latency should monitor the cluster and not run from the service because the network latency is seen from the cluster.
and then add the external metric to the HPA part in question 2.

```yaml
  metrics:
  - type: External
    external:
      metricName: network_latency
      metricSelector:
        matchLabels:
          metric_type: network_latency
      targetValue: 0.5
```

