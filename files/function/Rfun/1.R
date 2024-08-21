height<-c(1.75, 1.80, 1.65, 1.90, 1.74, 1.91)
weight<-c(60, 72, 57, 90, 95, 72)
sq.height<-height^2
ratio<-weight/sq.height
t.test(ratio, mu=22.5) 
